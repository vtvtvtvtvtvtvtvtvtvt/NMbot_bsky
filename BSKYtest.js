import pkg from "@atproto/api";
const {BskyAgent} = pkg;
import moment from 'moment-timezone';
import conf from 'config';

const service = "https://bsky.social";
const identifier = conf.identifier;
const password = conf.password;

const BAgent = new BskyAgent({ service });

async function postTweet(agent, str) {
	try {
		ret= await agent.bot.v2.tweet(str);
        console.log("success!: "+ret.data.text);
	} catch (e) {
        console.error(e)
    }
}

var ret=await BAgent.login({ identifier, password });
console.log(ret.success);
await BAgent.post({
  text: "【テスト】アカウント引き継ぎに伴うテスト投稿です。",
});