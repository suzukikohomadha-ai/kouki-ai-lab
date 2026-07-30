# アーカイブ：再編前の旧サブエージェント定義

2026-07-25の3事業体制（コホマダ／KINOTO／個人FP）への再編以前に存在していた、コホマダ事業向けの実サブエージェント定義（`jin.md` `kaede.md` `mei.md` `ren.md`）と、n8n実装担当の旧版（`eight.md`）をここに保管する。

いずれも新frontmatter規約（`name`/`description`/`tools`/`model`のみ）・新役職名に置き換えた版が `.claude/agents/` に存在する：

- `jin.md` → `jin-chief-of-staff.md`（役割をChief of Staffへ拡大。旧「実行支援業務」はレンへ統合）
- `kaede.md` → `kaede-creative-director.md`
- `mei.md` → `mei-automation-architect.md`
- `ren.md` → `ren-business-strategist.md`
- `eight.md` → `eito-n8n-engineer.md`（内容はほぼそのまま引き継ぎ、frontmatterのみ新規約に合わせた）

## 発見の経緯（監査メモ）

これらのファイルは、当初の監査（Globツールでの`.claude/agents/*.md`検索）では検出されなかった。PowerShellでの直接確認により存在が判明したため、監査漏れとして是正した。Globツールが`.claude`配下や日本語ファイル名を含むパスで結果を返さない場合があることが判明したため、今後はPowerShellでの直接確認を併用すること。
