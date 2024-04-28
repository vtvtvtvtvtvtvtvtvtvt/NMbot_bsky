import pkg from "@atproto/api";
const {BskyAgent} = pkg;
import moment from 'moment-timezone';
import conf from 'config';

const service = "https://bsky.social";
const identifier = conf.identifier;
const password = conf.password;

const BAgent = new BskyAgent({ service });

const agents=[
	{
		name: 'キャシー',
		itemName: 'キャシーイヤリング',
		area: 'z43',
		areaJN: 'パゴス',
		weather: 'w12',
		weatherJN: '吹雪'
	},
	{
		name: 'カニ',
		itemName: 'ブリッツリング',
		area: 'z43',
		areaJN: 'パゴス',
		weather: 'w04',
		weatherJN: '霧'
	},
	{
		name: 'スコル',
		itemName: 'スコルの牙',
		area: 'z44',
		areaJN: 'ピューロス',
		weather: 'w12',
		weatherJN: '吹雪'
	}
];

const areaArray=[
	{id:'z43', JN:['パゴス']},
	{id:'z44', JN:['ピューロス']},
];

const weatherArray=[
    {id:'w01', JN:'快晴'},
    {id:'w02', JN:'晴れ'},
    {id:'w04', JN:'霧'},
    {id:'w07', JN:'雷'},
    {id:'w11', JN:'雪'},
    {id:'w12', JN:'吹雪'},
    {id:'w13', JN:'灼熱波'},
    {id:'w18', JN:'霊風'}
];

const chanceArray= [
	{
		id:'z43',　fn: (chance) => {
			if ((chance -= 10) < 0) { return "w01"; }
			else if ((chance -= 18) < 0) { return "w04"; }
			else if ((chance -= 18) < 0) { return "w13"; }
			else if ((chance -= 18) < 0) { return "w11"; }
			else if ((chance -= 18) < 0) { return "w07"; }
			else { return "w12"; }
		}
	},
	{
		id:'z44',　fn: (chance) => {
			if ((chance -= 10) < 0) { return "w02"; }
			else if ((chance -= 18) < 0) { return "w13"; }
			else if ((chance -= 18) < 0) { return "w07"; }
			else if ((chance -= 18) < 0) { return "w12"; }
			else if ((chance -= 18) < 0) { return "w18"; }
			else { return "w11"; }
		}
	}
];

const INDICATOR_NONE = -1;
const INDICATOR_RED = 0;
const INDICATOR_ORANGE = 1;
const INDICATOR_YELLOW = 2;
const INDICATOR_GREEN = 3;

async function postTweet(agent, str) {
	try {
		await BAgent.post({
			text:str,
		});
        console.log("success!: "+str);
	} catch (e) {
        console.error(e)
    }
}

function p_calculateForecastTarget(timeMillis) {
	var unixSeconds = parseInt(timeMillis / 1000);
	var bell = unixSeconds / 175;
	var increment = (bell + 8 - (bell % 8)) % 24;
	var totalDays = unixSeconds / 4200;
	totalDays = (totalDays << 32) >>> 0;
	var calcBase = totalDays * 100 + increment;
	var step1 = ((calcBase << 11) ^ calcBase) >>> 0;
	var step2 = ((step1 >>> 8) ^ step1) >>> 0;
	return step2 % 100;
}

function p_getWeatherTimeFloor(date) {
      var unixSeconds = parseInt(date.getTime() / 1000);
      var bell = (unixSeconds / 175) % 24;
      var startBell = bell - (bell % 8);
      var startUnixSeconds = unixSeconds - (175 * (bell - startBell));
      return new Date(Math.round(startUnixSeconds) * 1000);
}

function getWeather(date, area, offset) {
	var chanceFn=chanceArray.filter(function(item){ if (item.id == area) return true; });
	var chance = p_calculateForecastTarget(offsetDateStartTime(p_getWeatherTimeFloor(date), offset));
	var weather=weatherArray.filter(function(item){ if (item.id == chanceFn[0].fn(chance)) return true; });
	return weather[0];
}

function  offsetDateStartTime(date, offset){
	return new Date(date.getTime()+(offset*8*175*1000));
}
function  offsetDateEndTime(date, offset){
	return new Date(date.getTime()+(((offset+1)*8*175-1)*1000));
}

function generateIndicator(agent, date, startOffset, endOffset) {
	var str=moment(offsetDateStartTime(date, endOffset-5)).tz("Asia/Tokyo").format('|HH:mm|');
	for( var i=endOffset-5; i<=endOffset; i++ ) {
		if (i==startOffset) {
			str=str+moment(offsetDateStartTime(date, i)).tz("Asia/Tokyo").format('|HH:mm|');
		}
		var weather=getWeather(date, agent.area, i);
		if (weather.id == agent.weather) {
			switch (generateIndicator_sub(agent, date, i)) {
				case INDICATOR_RED:
					str=str+(debug ? '0' : '🟥');
					break;
				case INDICATOR_ORANGE:
					str=str+(debug ? '1' : '🔴');
					break;
				case INDICATOR_YELLOW:
					str=str+(debug ? '2' : '🟨');
					break;
				case INDICATOR_GREEN:
					str=str+(debug ? '3' : '🟩');
					break;
				default:
					break;
			}
		} else {
			//str=str+(debug ? 'x' : '▪️');
			str=str+(debug ? 'x' : '🔳');
		}
	}	
	return str+moment(offsetDateEndTime(date, endOffset)).tz("Asia/Tokyo").format('|HH:mm|');
}

function generateIndicator_sub(agent, date, targetOffset){
	var ret=INDICATOR_NONE;
	
	// 対象天候でないならINDICATOR_NONE(-1)を返す
	var weather=getWeather(date, agent.area, targetOffset);
	if (weather.id != agent.weather) {
		return INDICATOR_NONE;
	}
	
	//まず同じ天候だったらスキップ
	for( var currStartOffset=targetOffset-1; currStartOffset>=targetOffset-999; currStartOffset-- ) {
		var weather=getWeather(date, agent.area, currStartOffset);
		if (weather.id != agent.weather) {
			break;
		}
	}
	
	//違う天候の始まり
	for( var prevEndOffset=currStartOffset-1; prevEndOffset>=targetOffset-999; prevEndOffset-- ) {
		var weather=getWeather(date, agent.area, prevEndOffset);
		if (weather.id == agent.weather) {
			break;
		}
	}
	
	//一個前の同じ天候のおわりに到達
	if ((targetOffset-prevEndOffset)>5) {
		// 6ピリオド以上空いている
		ret = INDICATOR_GREEN;
	} else if ((targetOffset-prevEndOffset)==5) {
		// 5ピリオド空いている
		ret = INDICATOR_YELLOW;
	} else {
		// 4ピリオド以下しか空いていない
		if (getMaxProbability(agent, date, targetOffset-5, targetOffset-1) > INDICATOR_RED ) {
			ret = INDICATOR_RED;
		} else {
			ret = INDICATOR_ORANGE;
		}
	}
	return ret;
}

function getMaxProbability(agent, date, startOffset, endOffset) {
	var ret=INDICATOR_NONE
	for( var i=startOffset; i<=endOffset; i++ ) {
		var j=generateIndicator_sub(agent, date, i)
		if (j > ret) {
			ret = j
		}
	}
	return ret;
}

function generateTimePeriodStr(date, startOffset, endOffset){
	var str='';
	if(startOffset<60) {
		str=moment(offsetDateStartTime(date, startOffset)).tz("Asia/Tokyo").format('HH:mm');
	} else {
		str=moment(offsetDateStartTime(date, startOffset)).tz("Asia/Tokyo").format('MM/DD HH:mm');
	}
	str=str+moment(offsetDateEndTime(date, endOffset)).tz("Asia/Tokyo").format('-HH:mm');
	return str;
}


function findEndOffset(agent, date, startOffset) {
	for( var j=startOffset+1; j<1000; j++ ) {
		var weather=getWeather(date, agent.area, j)
		if ( weather.id != agent.weather) {
			break;
		}
	}
	return j-1;
}

function findNextStartOffset(agent, date, currStartOffset) {
	var weatherChanged=false;
	for( var j=currStartOffset; j<1000; j++ ) {
		var weather=getWeather(date, agent.area, j);
		if ( weather.id != agent.weather) {
			weatherChanged=true;
		} else if (weatherChanged) {
			break;
		}
	}
	return j;
}

var debug;

if(process.argv[2] == "live") {
	debug=false;
	console.log('Server running!');
} else {
	debug=true;
	console.log('Debug!');
}

//for debug
var cnt=0;
var endCnt=cnt+500;
var startDate=new Date();

var prevDate_f=p_getWeatherTimeFloor(new Date());

var mainloopTimer;
if(debug) {
	mainloopTimer=setInterval( main_loop, 1 );
} else {
	mainloopTimer=setInterval( main_loop, 5000 );
	var ret = await BAgent.login({ identifier, password });
	console.log(ret);

}


function main_loop() {
	var date=new Date();
	if(debug) {
		cnt=cnt+1;
		if(cnt>endCnt){
			clearInterval(mainloopTimer);
		}
		date=new Date(startDate.getTime()+60*1000*cnt);
	}
	
	var date_f=p_getWeatherTimeFloor(date);
	
	if (date_f.getMinutes()!=prevDate_f.getMinutes()) {
		prevDate_f=date_f;
	} else {
		return;
	}
	
	
	var finalAnnoStr="";
	for( var phase=0; phase<2; phase++) {
		for( var i=0; i<agents.length; i++ ) {
			var annoStr="";
			var startOffset=findNextStartOffset(agents[i], date_f, 0);
			var endOffset=findEndOffset(agents[i], date_f, startOffset);
			
			var currentWeather=getWeather(date_f, agents[i].area, 0);
			if ((phase==0) && ( currentWeather.id == agents[i].weather)) {
				//今は対象天候である
				var prevWeather=getWeather(date_f, agents[i].area, -1);
				if( prevWeather.id == agents[i].weather) {
					//一個前が同じ天候だった
					continue;
				}
				
				var startOffset2=findNextStartOffset(agents[i], date_f, -1);
				var endOffset2=findEndOffset(agents[i], date_f, startOffset2);
				if(getMaxProbability(agents[i], date_f, startOffset2, endOffset2) == INDICATOR_GREEN) {
					annoStr=annoStr+"【確定湧き】";
				}
				annoStr=annoStr+agents[i].areaJN+"が";
				annoStr=annoStr+agents[i].weatherJN+"になりました。";
				
				annoStr=annoStr+"次回は"+generateTimePeriodStr(date_f, startOffset, endOffset);
				if(getMaxProbability(agents[i], date_f, startOffset, endOffset) == INDICATOR_GREEN) {
					annoStr=annoStr+"（確定湧き）";
				}
				annoStr=annoStr+"です。";
				
				startOffset=0;
				endOffset=findEndOffset(agents[i], date_f, startOffset);
				
			} else if ((phase==1) && ( currentWeather.id != agents[i].weather)) {
				//今は対象天候でない
				var nextWeather=getWeather(date_f, agents[i].area, 1);
				if( nextWeather.id == agents[i].weather) {
					//次に対象天候に切り替わる
					if(getMaxProbability(agents[i], date_f, startOffset, endOffset) == INDICATOR_GREEN) {
						annoStr=annoStr+"【確定湧き】";
					}
					annoStr=annoStr+agents[i].areaJN+"が";
					annoStr=annoStr+generateTimePeriodStr(date_f, startOffset, endOffset)+"に"+agents[i].weatherJN;
					annoStr=annoStr+"になります。";
				}
			}
					
			if(annoStr!="") {
				for( var j=0; j<3; j++ ) {
					annoStr=annoStr+'\n'+generateIndicator(agents[i], date_f, startOffset, endOffset);
					startOffset=findNextStartOffset(agents[i], date_f, startOffset);
					endOffset=findEndOffset(agents[i], date_f, startOffset);
				}
				annoStr=annoStr+'\n#'+agents[i].itemName;
				if(finalAnnoStr!="") {
					finalAnnoStr=finalAnnoStr+"\n\n"
				}
				finalAnnoStr=finalAnnoStr+annoStr
			}
		}
	}
	
	if(finalAnnoStr!="") {
		finalAnnoStr=finalAnnoStr+' #FF14 #エウレカNMBOT'
		if(debug) {
			finalAnnoStr=cnt+' ['+moment(date).tz("Asia/Tokyo").format('HH:mm')+']\n'+finalAnnoStr;
			console.log(finalAnnoStr);
			console.log('');
		} else  {
			postTweet(agents[i], finalAnnoStr);
		}
	}
}
