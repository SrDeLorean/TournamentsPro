import { getPublicCompetitionsAction } from './src/app/actions/competitions';

async function run() {
  const result = await getPublicCompetitionsAction('lol');
  console.log(JSON.stringify(result, null, 2));
}

run();
