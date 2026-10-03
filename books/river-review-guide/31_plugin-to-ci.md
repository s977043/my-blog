# Pluginから始め、必要ならCIへ広げる

導入経路は目的によって異なります。

- 対話的に試したい: Plugin
- ローカルで明示的に回したい: CLI
- PRで継続的に観測したい: GitHub Actions
- 既存基盤へ観点だけ移したい: Skill adoption only

CIへ入れる場合も、最初からblockingにしない選択があります。

現行Adopter Playbookでは、comment-onlyから観測し、重大な観点だけwarn / blockingへ段階的に昇格する方針が示されています。
