import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
test('release scope conserva dotfiles y rechaza rutas absolutas/traversal',{skip:process.platform!=='win32'},()=>{
  const source=readFileSync(new URL('../release-governance-guard.ps1',import.meta.url),'utf8');
  const functionText=source.match(/^function Normalize-Scope[\s\S]*?^}/m)[0];
  const cases=[
    "Normalize-Scope '.dockerignore'",
    "Normalize-Scope './.dockerignore'",
    "Normalize-Scope 'bocetos\\public/'",
    "foreach ($bad in @('../secreto','/root/file','C:\\secret','.\\..\\secret')) {",
    "try { $null = Normalize-Scope $bad; throw 'accepted_invalid_scope' }",
    "catch { if ($_.Exception.Message -eq 'accepted_invalid_scope') { throw } }",
    "}",
    "exit 0"
  ].join('\n');
  const result=spawnSync('powershell',['-NoProfile','-NonInteractive','-Command',functionText+'\n'+cases],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  assert.deepEqual(result.stdout.trim().split(/\r?\n/),['.dockerignore','.dockerignore','bocetos/public']);
});
