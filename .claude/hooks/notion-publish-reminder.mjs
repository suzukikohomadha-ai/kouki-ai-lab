process.stdout.write(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    additionalContext:
      "[外部公開前チェック] これがnote/SNS向けの外部公開コンテンツの書き込みであれば、公開前に必ずaoi-quality-auditorの監査を経てください（.claude/rules/external-publication-policy.md）。監査を経ていない場合は、その旨をユーザーに伝えてから進めてください。この処理をブロックするものではありません。"
  }
}));
