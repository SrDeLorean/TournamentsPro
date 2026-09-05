import { NextResponse } from 'next/server';
import { getOrganizerOrganizationAction } from '@/app/actions/organizations';

export async function GET() {
  const result = await getOrganizerOrganizationAction();
  return NextResponse.json(result);
}
