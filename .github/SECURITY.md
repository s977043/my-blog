# Security Policy

このリポジトリは個人の Zenn / Qiita / note コンテンツ管理用です。

セキュリティに関わる問題や公開前に扱うべき内容がある場合は、公開 Issue ではなく、リポジトリ管理者へ非公開の連絡手段で共有してください。

## 共通

- 依存関係の脆弱性は GitHub Actions と Dependabot の更新 PR で確認します。
- 大容量バイナリや機密情報を含むファイルは `.gitignore` で除外します。

## Qiita

- Qiita CLI の認証情報（トークン）はローカルの `~/.config/qiita-cli/` に保存し、リポジトリにコミットしません。誤って含めた場合は速やかに当該トークンを失効してください。

## note

- note.com の公式エクスポート ZIP（`articles_note/export/YYYY-MM-DD/*.zip`）は `.gitignore` で除外し、リポジトリにコミットしません。
- エクスポート ZIP および展開後の `articles_note/published/` `drafts/` には、下書き段階の未公開本文や画像メタデータ（EXIF 等）が含まれる場合があります。他者へ共有・添付する前に内容を確認してください。
- note のインポート／エクスポートに認証トークンは使いませんが、note アカウントのログイン情報は当然リポジトリに含めません。
