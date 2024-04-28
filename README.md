# Eureka NM Bluesky BOT

## Overview
FF14の禁断の地エウレカにおける、特定のNMが出現する可能性がある天候の到来を通知するBluesky BOT用のソースコードです。  

例（デモ）：  
https://bsky.app/profile/eurekanmbot.bsky.social

## Prerequisites
- npm >= 9.8.1
- node >= 18.17.1
- Blueskyアカウントが1つ必要です。

## Install
```
npm i
```

## Usage
- config/default.jsonとして、ログインIDとアプリパスワードを以下の様に記述する。
```
{
    "identifier" : "***",
    "password" : "****-****-****-****"
}
```

-　以下でサービス起動（cronやtmuxを利用すると良いでしょう。）
```
node test_BSKY.js live
```

## About debug
Blueskyアカウントへのアクセスを伴わせずに、BOTの動作だけ確認したい場合は上記のコマンドから引数"live"を抜いて実行してください。  
現在時刻からある程度未来までの投稿予定内容がコンソールへ吐き出されます。  

```
node test_BSKY.js
```

## Reference
- [eorzea-weather](https://github.com/eorzea-weather/node-eorzea-weather/)
現実の時刻からエオルゼア内での天気を求める方法についてかなり参考にさせて頂きました。

## FAQ
```
Q: 改造（改変）していいですか？  
A: OKです。 MITライセンスを採用しているので、その中で許可されていることであればOKです。
   それらの通知・監視機構についてはほとんど作っていないので、そのあたりは改造したほうが扱いやすいかもしれません。

Q: このソースコードを参考にして独自の通知アプリを作ってもいいですか？  
A: 大歓迎です。（参考になると嬉しいです。。）
```

## Author
vt

## Licence
[MIT license](https://github.com/vtvtvtvtvtvtvtvtvtvt/NMbot_bsky/blob/master/LICENSE)  

FINAL FANTASY is a registered trademark of Square Enix Holdings Co., Ltd.  
FINAL FANTASY XIV © 2010 - 2024 SQUARE ENIX CO., LTD. All Rights Reserved.
