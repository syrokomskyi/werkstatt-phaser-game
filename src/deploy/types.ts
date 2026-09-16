/*
<MODULE_CONTRACT>
<purpose>Shared deploy types for Phaser deploy adapters.</purpose>

<non-goals>
  <item>Do not import from any @warpgogol/* package — pure type definitions.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into <history>, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
</CHANGE_SUMMARY>
*/

export interface DeployResult {
  success: boolean;
  url?: string;
  urls?: string[];
  errors?: string[];
}
