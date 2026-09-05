import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getUsersByRoleService,
  checkUserBanStatusService,
  banUserFromChatService,
  unbanUserFromChatService,
  updateTypingStatusService,
  clearTypingStatusService,
  getTypingUsersService,
  getChatThreadsService,
  getThreadMessagesService,
  createOrGetDirectThreadService,
  sendChatMessageService,
  reportChatMessageService,
  getChatReportsService,
  resolveChatReportService,
  getUserChatHistoryService,
} from '../src/lib/services/chat.service';
import { dbProvider } from '../src/lib/db/provider';

describe('eSports chat and moderation system', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches users by role using the shared dbProvider repository without raw SQL crashes', async () => {
    const mockUsers = [
      { id: 'usr-1', name: 'Admin One', gamertag: 'Admin1', role: 'Administrador', primaryGameSlug: 'valorant', isBanned: false, banReason: null },
      { id: 'usr-2', name: 'Org One', gamertag: 'Org1', role: 'Organizador', primaryGameSlug: 'valorant', isBanned: false, banReason: null },
    ];

    vi.spyOn(dbProvider.users, 'findAll').mockResolvedValue(mockUsers as any);

    const result = await getUsersByRoleService('Administrador');
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: 'usr-1',
      name: 'Admin One',
      gamertag: 'Admin1',
      role: 'Administrador',
      gameSlug: 'valorant',
      isBanned: false,
      banReason: null,
    });
    expect(dbProvider.users.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { role: expect.arrayContaining(['Administrador', 'admin']) },
        orderBy: 'name',
        orderDirection: 'ASC',
      })
    );
  });

  it('normalizes Capitán and Jugador variants when querying available users', async () => {
    const findAllSpy = vi.spyOn(dbProvider.users, 'findAll').mockResolvedValue([]);

    await getUsersByRoleService('Capitan');
    expect(findAllSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { role: expect.arrayContaining(['Capitan', 'Capitán']) },
      })
    );

    await getUsersByRoleService('Jugador');
    expect(findAllSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { role: expect.arrayContaining(['Jugador', 'Atleta']) },
      })
    );
  });

  it('checks user ban status safely using repository findById', async () => {
    vi.spyOn(dbProvider.users, 'findById').mockResolvedValue({
      id: 'usr-banned',
      name: 'Banned User',
      status: 'Activo',
      isBanned: true,
      banReason: 'Infracción grave de conducta',
    } as any);

    const status = await checkUserBanStatusService('usr-banned');
    expect(status.isBanned).toBe(true);
    expect(status.isChatBanned).toBe(true);
    expect(status.reason).toBe('Infracción grave de conducta');
  });

  it('bans and unbans users through dbProvider repository update', async () => {
    const updateSpy = vi.spyOn(dbProvider.users, 'update').mockResolvedValue({} as any);

    const banResult = await banUserFromChatService('usr-target', 'Conducta antideportiva');
    expect(banResult.success).toBe(true);
    expect(updateSpy).toHaveBeenCalledWith('usr-target', {
      isBanned: true,
      banReason: 'Conducta antideportiva',
    });

    const unbanResult = await unbanUserFromChatService('usr-target');
    expect(unbanResult.success).toBe(true);
    expect(updateSpy).toHaveBeenCalledWith('usr-target', {
      isBanned: false,
      banReason: null,
    });
  });

  it('manages typing status in ephemeral memory correctly', async () => {
    await updateTypingStatusService('ct-100', 'usr-player-1', 'Player One');
    await updateTypingStatusService('ct-100', 'usr-player-2', 'Player Two');

    // From perspective of player 1, player 2 is typing
    const typingForPlayer1 = await getTypingUsersService('ct-100', 'usr-player-1');
    expect(typingForPlayer1).toEqual(['Player Two']);

    // From perspective of player 3, both are typing
    const typingForPlayer3 = await getTypingUsersService('ct-100', 'usr-player-3');
    expect(typingForPlayer3).toEqual(['Player One', 'Player Two']);

    // Clearing typing status
    await clearTypingStatusService('ct-100', 'usr-player-2');
    const updatedTyping = await getTypingUsersService('ct-100', 'usr-player-3');
    expect(updatedTyping).toEqual(['Player One']);
  });

  it('blocks banned users from sending messages', async () => {
    vi.spyOn(dbProvider.users, 'findById').mockResolvedValue({
      id: 'usr-silenced',
      status: 'Activo',
      isBanned: true,
      banReason: 'Toxicidad en chat',
    } as any);

    const result = await sendChatMessageService('ct-test', 'usr-silenced', 'Silenced User', 'Jugador', 'Hola mundo');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Has sido silenciado/baneado');
  });

  it('registers a chat message report into security audit log', async () => {
    const querySpy = vi.spyOn(dbProvider, 'query').mockResolvedValue([] as any);

    const result = await reportChatMessageService({
      reporterId: 'usr-reporter',
      reporterName: 'Reporter Guy',
      reporterRole: 'Jugador',
      reportedUserId: 'usr-bad',
      reportedUserName: 'Bad Guy',
      threadId: 'thread-1',
      messageId: 'msg-1',
      messageText: 'Toxic comment here',
      reason: 'Toxicidad / Lenguaje Ofensivo',
      details: 'Spamming insults in post-match chat',
    });

    expect(result.success).toBe(true);
    expect(result.reportId).toBeDefined();
    expect(querySpy).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO security_audit_log'),
      expect.arrayContaining(['usr-reporter', 'Jugador', 'usr-bad'])
    );
  });

  it('retrieves chat reports from security audit log and filters by status', async () => {
    const mockAuditLogs = [
      {
        id: 'rep-1',
        actor_user_id: 'usr-1',
        actor_role: 'Jugador',
        resource_id: 'usr-bad',
        outcome: 'PENDING',
        metadata_json: JSON.stringify({
          reporterId: 'usr-1',
          reporterName: 'User One',
          reporterRole: 'Jugador',
          reportedUserId: 'usr-bad',
          reportedUserName: 'Bad Guy',
          threadId: 'th-1',
          messageId: 'm-1',
          messageText: 'GG ez noobs',
          reason: 'Toxicidad',
          status: 'Pendiente',
          createdAt: '2026-09-04T20:00:00.000Z',
        }),
        created_at: '2026-09-04T20:00:00.000Z',
      },
      {
        id: 'rep-2',
        actor_user_id: 'usr-2',
        actor_role: 'Capitan',
        resource_id: 'usr-other',
        outcome: 'RESOLVED_BANNED',
        metadata_json: JSON.stringify({
          reporterId: 'usr-2',
          reporterName: 'Capitan Two',
          reporterRole: 'Capitan',
          reportedUserId: 'usr-other',
          reportedUserName: 'Other Guy',
          threadId: 'th-2',
          messageId: 'm-2',
          messageText: 'Cheating tool link',
          reason: 'Trampas',
          status: 'Sancionado',
          createdAt: '2026-09-04T19:00:00.000Z',
        }),
        created_at: '2026-09-04T19:00:00.000Z',
      },
    ];

    vi.spyOn(dbProvider, 'query').mockResolvedValue(mockAuditLogs as any);

    const allReports = await getChatReportsService();
    expect(allReports).toHaveLength(2);
    expect(allReports[0].reportedUserName).toBe('Bad Guy');
    expect(allReports[0].status).toBe('Pendiente');

    const pendingOnly = await getChatReportsService('Pendiente');
    expect(pendingOnly).toHaveLength(1);
    expect(pendingOnly[0].id).toBe('rep-1');
  });

  it('resolves a chat report with sanction status and moderator notes', async () => {
    const existingLog = [
      {
        id: 'rep-1',
        metadata_json: JSON.stringify({
          reporterId: 'usr-1',
          reportedUserId: 'usr-bad',
          status: 'Pendiente',
        }),
      },
    ];

    const querySpy = vi.spyOn(dbProvider, 'query')
      .mockResolvedValueOnce(existingLog as any)
      .mockResolvedValueOnce([] as any);

    const result = await resolveChatReportService(
      'rep-1',
      'Sancionado',
      'Usuario baneado permanentemente por toxicidad',
      'Admin Master'
    );

    expect(result.success).toBe(true);
    expect(querySpy).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE security_audit_log'),
      expect.arrayContaining(['RESOLVED_BANNED', expect.stringContaining('Usuario baneado permanentemente'), 'rep-1'])
    );
  });

  it('retrieves user chat history for audit and ban verification', async () => {
    vi.spyOn(dbProvider.users, 'findById').mockResolvedValue({
      id: 'usr-history-target',
      name: 'Audited Player',
      gamertag: 'AuditPlayer',
      email: 'player@esports.com',
      role: 'Jugador',
      isBanned: false,
      banReason: null,
      status: 'Activo',
    } as any);

    const mockMessages = [
      {
        id: 'msg-10',
        thread_id: 'th-general',
        channel_type: 'DIRECTO',
        game_slug: 'eafc26',
        thread_title: 'Sala General EA Sports FC',
        sender_id: 'usr-history-target',
        sender_name: 'Audited Player',
        sender_role: 'Jugador',
        message_text: 'Mensaje de prueba número uno',
        created_at: '2026-09-04T21:00:00.000Z',
        is_read: 1,
      },
      {
        id: 'msg-11',
        thread_id: 'th-direct',
        channel_type: 'DIRECTO',
        game_slug: 'valorant',
        thread_title: 'Chat con Rival',
        sender_id: 'usr-history-target',
        sender_name: 'Audited Player',
        sender_role: 'Jugador',
        message_text: 'Mensaje de prueba número dos',
        created_at: '2026-09-04T21:05:00.000Z',
        is_read: 0,
      },
    ];

    vi.spyOn(dbProvider, 'query').mockResolvedValue(mockMessages as any);

    const history = await getUserChatHistoryService('usr-history-target');
    expect(history).not.toBeNull();
    expect(history?.user.name).toBe('Audited Player');
    expect(history?.totalMessages).toBe(2);
    expect(history?.messages[0].messageText).toBe('Mensaje de prueba número uno');
    expect(history?.messages[0].threadTitle).toBe('Sala General EA Sports FC');
    expect(history?.messages[1].messageText).toBe('Mensaje de prueba número dos');
  });
});
