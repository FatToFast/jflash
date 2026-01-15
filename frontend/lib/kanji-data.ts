/**
 * Kanji Data - Frontend kanji dictionary
 * Ported from backend/services/kanji_service.py
 * Contains ~100+ N5/N4 kanji with readings and meanings
 */

export interface KanjiInfo {
  character: string;
  on_readings: string[];   // 음독 (Chinese reading)
  kun_readings: string[];  // 훈독 (Japanese reading)
  meanings: string[];      // English meanings
  meanings_ko: string[];   // Korean meanings
  strokes: number;         // Stroke count
  jlpt_level: number;      // JLPT level (5=N5, 4=N4, etc.)
}

interface KanjiDictEntry {
  on: string[];
  kun: string[];
  meanings: string[];
  meanings_ko: string[];
  strokes: number;
  jlpt: number;
}

// Common kanji dictionary with readings and meanings
const KANJI_DICT: Record<string, KanjiDictEntry> = {
  // N5 Level Kanji (Basic)
  "一": { on: ["イチ", "イツ"], kun: ["ひと", "ひと.つ"], meanings: ["one"], meanings_ko: ["하나", "일"], strokes: 1, jlpt: 5 },
  "二": { on: ["ニ", "ジ"], kun: ["ふた", "ふた.つ"], meanings: ["two"], meanings_ko: ["둘", "이"], strokes: 2, jlpt: 5 },
  "三": { on: ["サン", "ゾウ"], kun: ["み", "み.つ"], meanings: ["three"], meanings_ko: ["셋", "삼"], strokes: 3, jlpt: 5 },
  "四": { on: ["シ"], kun: ["よ", "よ.つ", "よん"], meanings: ["four"], meanings_ko: ["넷", "사"], strokes: 5, jlpt: 5 },
  "五": { on: ["ゴ"], kun: ["いつ", "いつ.つ"], meanings: ["five"], meanings_ko: ["다섯", "오"], strokes: 4, jlpt: 5 },
  "六": { on: ["ロク", "リク"], kun: ["む", "む.つ", "むい"], meanings: ["six"], meanings_ko: ["여섯", "육"], strokes: 4, jlpt: 5 },
  "七": { on: ["シチ"], kun: ["なな", "なな.つ", "なの"], meanings: ["seven"], meanings_ko: ["일곱", "칠"], strokes: 2, jlpt: 5 },
  "八": { on: ["ハチ"], kun: ["や", "や.つ", "やっ.つ"], meanings: ["eight"], meanings_ko: ["여덟", "팔"], strokes: 2, jlpt: 5 },
  "九": { on: ["キュウ", "ク"], kun: ["ここの", "ここの.つ"], meanings: ["nine"], meanings_ko: ["아홉", "구"], strokes: 2, jlpt: 5 },
  "十": { on: ["ジュウ", "ジッ"], kun: ["とお", "と"], meanings: ["ten"], meanings_ko: ["열", "십"], strokes: 2, jlpt: 5 },
  "百": { on: ["ヒャク", "ビャク"], kun: ["もも"], meanings: ["hundred"], meanings_ko: ["백"], strokes: 6, jlpt: 5 },
  "千": { on: ["セン"], kun: ["ち"], meanings: ["thousand"], meanings_ko: ["천"], strokes: 3, jlpt: 5 },
  "万": { on: ["マン", "バン"], kun: ["よろず"], meanings: ["ten thousand"], meanings_ko: ["만"], strokes: 3, jlpt: 5 },
  "円": { on: ["エン"], kun: ["まる.い"], meanings: ["circle", "yen"], meanings_ko: ["엔", "원"], strokes: 4, jlpt: 5 },
  "日": { on: ["ニチ", "ジツ"], kun: ["ひ", "か"], meanings: ["day", "sun", "Japan"], meanings_ko: ["날", "해", "일본"], strokes: 4, jlpt: 5 },
  "月": { on: ["ゲツ", "ガツ"], kun: ["つき"], meanings: ["month", "moon"], meanings_ko: ["달", "월"], strokes: 4, jlpt: 5 },
  "火": { on: ["カ"], kun: ["ひ", "ほ"], meanings: ["fire"], meanings_ko: ["불"], strokes: 4, jlpt: 5 },
  "水": { on: ["スイ"], kun: ["みず"], meanings: ["water"], meanings_ko: ["물"], strokes: 4, jlpt: 5 },
  "木": { on: ["ボク", "モク"], kun: ["き", "こ"], meanings: ["tree", "wood"], meanings_ko: ["나무"], strokes: 4, jlpt: 5 },
  "金": { on: ["キン", "コン", "ゴン"], kun: ["かね", "かな"], meanings: ["gold", "money"], meanings_ko: ["금", "돈"], strokes: 8, jlpt: 5 },
  "土": { on: ["ド", "ト"], kun: ["つち"], meanings: ["earth", "soil"], meanings_ko: ["흙", "땅"], strokes: 3, jlpt: 5 },
  "年": { on: ["ネン"], kun: ["とし"], meanings: ["year"], meanings_ko: ["해", "년"], strokes: 6, jlpt: 5 },
  "時": { on: ["ジ"], kun: ["とき"], meanings: ["time", "hour"], meanings_ko: ["때", "시"], strokes: 10, jlpt: 5 },
  "分": { on: ["ブン", "フン", "ブ"], kun: ["わ.ける", "わ.かる"], meanings: ["minute", "part"], meanings_ko: ["분", "나누다"], strokes: 4, jlpt: 5 },
  "人": { on: ["ジン", "ニン"], kun: ["ひと"], meanings: ["person"], meanings_ko: ["사람"], strokes: 2, jlpt: 5 },
  "子": { on: ["シ", "ス"], kun: ["こ"], meanings: ["child"], meanings_ko: ["아이", "자"], strokes: 3, jlpt: 5 },
  "女": { on: ["ジョ", "ニョ"], kun: ["おんな", "め"], meanings: ["woman", "female"], meanings_ko: ["여자"], strokes: 3, jlpt: 5 },
  "男": { on: ["ダン", "ナン"], kun: ["おとこ"], meanings: ["man", "male"], meanings_ko: ["남자"], strokes: 7, jlpt: 5 },
  "山": { on: ["サン", "セン"], kun: ["やま"], meanings: ["mountain"], meanings_ko: ["산"], strokes: 3, jlpt: 5 },
  "川": { on: ["セン"], kun: ["かわ"], meanings: ["river"], meanings_ko: ["강"], strokes: 3, jlpt: 5 },
  "田": { on: ["デン"], kun: ["た"], meanings: ["rice field"], meanings_ko: ["논", "밭"], strokes: 5, jlpt: 5 },
  "本": { on: ["ホン"], kun: ["もと"], meanings: ["book", "origin"], meanings_ko: ["책", "근본"], strokes: 5, jlpt: 5 },
  "学": { on: ["ガク"], kun: ["まな.ぶ"], meanings: ["learn", "study"], meanings_ko: ["배우다", "학"], strokes: 8, jlpt: 5 },
  "校": { on: ["コウ", "キョウ"], kun: [], meanings: ["school"], meanings_ko: ["학교"], strokes: 10, jlpt: 5 },
  "生": { on: ["セイ", "ショウ"], kun: ["い.きる", "う.まれる", "なま"], meanings: ["life", "birth", "raw"], meanings_ko: ["살다", "태어나다", "날것"], strokes: 5, jlpt: 5 },
  "先": { on: ["セン"], kun: ["さき", "ま.ず"], meanings: ["previous", "ahead"], meanings_ko: ["먼저", "앞"], strokes: 6, jlpt: 5 },
  "語": { on: ["ゴ"], kun: ["かた.る", "かた.らう"], meanings: ["language", "word"], meanings_ko: ["말", "언어"], strokes: 14, jlpt: 5 },
  "読": { on: ["ドク", "トク", "トウ"], kun: ["よ.む"], meanings: ["read"], meanings_ko: ["읽다"], strokes: 14, jlpt: 5 },
  "書": { on: ["ショ"], kun: ["か.く"], meanings: ["write"], meanings_ko: ["쓰다"], strokes: 10, jlpt: 5 },
  "話": { on: ["ワ"], kun: ["はな.す", "はなし"], meanings: ["talk", "speak"], meanings_ko: ["말하다", "이야기"], strokes: 13, jlpt: 5 },
  "聞": { on: ["ブン", "モン"], kun: ["き.く", "き.こえる"], meanings: ["hear", "listen"], meanings_ko: ["듣다"], strokes: 14, jlpt: 5 },
  "見": { on: ["ケン"], kun: ["み.る", "み.える"], meanings: ["see", "look"], meanings_ko: ["보다"], strokes: 7, jlpt: 5 },
  "食": { on: ["ショク", "ジキ"], kun: ["た.べる", "く.う"], meanings: ["eat", "food"], meanings_ko: ["먹다", "음식"], strokes: 9, jlpt: 5 },
  "飲": { on: ["イン", "オン"], kun: ["の.む"], meanings: ["drink"], meanings_ko: ["마시다"], strokes: 12, jlpt: 5 },
  "行": { on: ["コウ", "ギョウ", "アン"], kun: ["い.く", "ゆ.く", "おこな.う"], meanings: ["go", "conduct"], meanings_ko: ["가다", "행하다"], strokes: 6, jlpt: 5 },
  "来": { on: ["ライ", "タイ"], kun: ["く.る", "きた.る"], meanings: ["come"], meanings_ko: ["오다"], strokes: 7, jlpt: 5 },
  "出": { on: ["シュツ", "スイ"], kun: ["で.る", "だ.す"], meanings: ["exit", "leave"], meanings_ko: ["나가다", "나오다"], strokes: 5, jlpt: 5 },
  "入": { on: ["ニュウ", "ジュ"], kun: ["い.る", "はい.る"], meanings: ["enter"], meanings_ko: ["들어가다"], strokes: 2, jlpt: 5 },
  "休": { on: ["キュウ"], kun: ["やす.む", "やす.まる"], meanings: ["rest"], meanings_ko: ["쉬다"], strokes: 6, jlpt: 5 },
  "買": { on: ["バイ"], kun: ["か.う"], meanings: ["buy"], meanings_ko: ["사다"], strokes: 12, jlpt: 5 },
  "高": { on: ["コウ"], kun: ["たか.い", "たか"], meanings: ["tall", "high", "expensive"], meanings_ko: ["높다", "비싸다"], strokes: 10, jlpt: 5 },
  "安": { on: ["アン"], kun: ["やす.い", "やす"], meanings: ["cheap", "peaceful"], meanings_ko: ["싸다", "편안하다"], strokes: 6, jlpt: 5 },
  "新": { on: ["シン"], kun: ["あたら.しい", "あら.た", "にい"], meanings: ["new"], meanings_ko: ["새롭다"], strokes: 13, jlpt: 5 },
  "古": { on: ["コ"], kun: ["ふる.い", "ふる"], meanings: ["old"], meanings_ko: ["오래되다", "낡다"], strokes: 5, jlpt: 5 },
  "大": { on: ["ダイ", "タイ"], kun: ["おお.きい", "おお"], meanings: ["big", "large"], meanings_ko: ["크다"], strokes: 3, jlpt: 5 },
  "小": { on: ["ショウ"], kun: ["ちい.さい", "こ", "お"], meanings: ["small", "little"], meanings_ko: ["작다"], strokes: 3, jlpt: 5 },
  "長": { on: ["チョウ"], kun: ["なが.い", "おさ"], meanings: ["long", "chief"], meanings_ko: ["길다", "우두머리"], strokes: 8, jlpt: 5 },
  "短": { on: ["タン"], kun: ["みじか.い"], meanings: ["short"], meanings_ko: ["짧다"], strokes: 12, jlpt: 5 },
  "白": { on: ["ハク", "ビャク"], kun: ["しろ", "しら", "しろ.い"], meanings: ["white"], meanings_ko: ["흰색", "하얗다"], strokes: 5, jlpt: 5 },
  "黒": { on: ["コク"], kun: ["くろ", "くろ.い"], meanings: ["black"], meanings_ko: ["검정", "검다"], strokes: 11, jlpt: 5 },
  "赤": { on: ["セキ", "シャク"], kun: ["あか", "あか.い"], meanings: ["red"], meanings_ko: ["빨강", "빨갛다"], strokes: 7, jlpt: 5 },
  "青": { on: ["セイ", "ショウ"], kun: ["あお", "あお.い"], meanings: ["blue", "green"], meanings_ko: ["파랑", "초록"], strokes: 8, jlpt: 5 },
  "車": { on: ["シャ"], kun: ["くるま"], meanings: ["car", "vehicle"], meanings_ko: ["차", "자동차"], strokes: 7, jlpt: 5 },
  "電": { on: ["デン"], kun: [], meanings: ["electricity"], meanings_ko: ["전기"], strokes: 13, jlpt: 5 },
  "駅": { on: ["エキ"], kun: [], meanings: ["station"], meanings_ko: ["역"], strokes: 14, jlpt: 5 },
  "道": { on: ["ドウ", "トウ"], kun: ["みち"], meanings: ["road", "way"], meanings_ko: ["길"], strokes: 12, jlpt: 5 },
  "北": { on: ["ホク"], kun: ["きた"], meanings: ["north"], meanings_ko: ["북쪽"], strokes: 5, jlpt: 5 },
  "南": { on: ["ナン", "ナ"], kun: ["みなみ"], meanings: ["south"], meanings_ko: ["남쪽"], strokes: 9, jlpt: 5 },
  "東": { on: ["トウ"], kun: ["ひがし"], meanings: ["east"], meanings_ko: ["동쪽"], strokes: 8, jlpt: 5 },
  "西": { on: ["セイ", "サイ"], kun: ["にし"], meanings: ["west"], meanings_ko: ["서쪽"], strokes: 6, jlpt: 5 },
  "右": { on: ["ウ", "ユウ"], kun: ["みぎ"], meanings: ["right"], meanings_ko: ["오른쪽"], strokes: 5, jlpt: 5 },
  "左": { on: ["サ", "シャ"], kun: ["ひだり"], meanings: ["left"], meanings_ko: ["왼쪽"], strokes: 5, jlpt: 5 },
  "上": { on: ["ジョウ", "ショウ"], kun: ["うえ", "あ.がる", "のぼ.る"], meanings: ["up", "above"], meanings_ko: ["위"], strokes: 3, jlpt: 5 },
  "下": { on: ["カ", "ゲ"], kun: ["した", "さ.がる", "くだ.る"], meanings: ["down", "below"], meanings_ko: ["아래"], strokes: 3, jlpt: 5 },
  "中": { on: ["チュウ"], kun: ["なか"], meanings: ["middle", "inside"], meanings_ko: ["안", "가운데"], strokes: 4, jlpt: 5 },
  "外": { on: ["ガイ", "ゲ"], kun: ["そと", "ほか", "はず.す"], meanings: ["outside"], meanings_ko: ["밖"], strokes: 5, jlpt: 5 },
  "前": { on: ["ゼン"], kun: ["まえ"], meanings: ["front", "before"], meanings_ko: ["앞"], strokes: 9, jlpt: 5 },
  "後": { on: ["ゴ", "コウ"], kun: ["うし.ろ", "あと", "のち"], meanings: ["behind", "after"], meanings_ko: ["뒤"], strokes: 9, jlpt: 5 },
  "午": { on: ["ゴ"], kun: ["うま"], meanings: ["noon"], meanings_ko: ["정오"], strokes: 4, jlpt: 5 },
  "今": { on: ["コン", "キン"], kun: ["いま"], meanings: ["now"], meanings_ko: ["지금"], strokes: 4, jlpt: 5 },
  "何": { on: ["カ"], kun: ["なに", "なん"], meanings: ["what"], meanings_ko: ["무엇"], strokes: 7, jlpt: 5 },
  "名": { on: ["メイ", "ミョウ"], kun: ["な"], meanings: ["name"], meanings_ko: ["이름"], strokes: 6, jlpt: 5 },
  "国": { on: ["コク"], kun: ["くに"], meanings: ["country"], meanings_ko: ["나라"], strokes: 8, jlpt: 5 },
  "天": { on: ["テン"], kun: ["あまつ", "あめ", "あま"], meanings: ["heaven", "sky"], meanings_ko: ["하늘"], strokes: 4, jlpt: 5 },
  "気": { on: ["キ", "ケ"], kun: [], meanings: ["spirit", "air"], meanings_ko: ["기운", "공기"], strokes: 6, jlpt: 5 },
  "雨": { on: ["ウ"], kun: ["あめ", "あま"], meanings: ["rain"], meanings_ko: ["비"], strokes: 8, jlpt: 5 },
  "花": { on: ["カ", "ケ"], kun: ["はな"], meanings: ["flower"], meanings_ko: ["꽃"], strokes: 7, jlpt: 5 },
  "店": { on: ["テン"], kun: ["みせ"], meanings: ["store", "shop"], meanings_ko: ["가게"], strokes: 8, jlpt: 5 },
  "社": { on: ["シャ"], kun: ["やしろ"], meanings: ["company", "shrine"], meanings_ko: ["회사", "신사"], strokes: 7, jlpt: 5 },
  "会": { on: ["カイ", "エ"], kun: ["あ.う"], meanings: ["meet", "society"], meanings_ko: ["만나다", "회"], strokes: 6, jlpt: 5 },
  "毎": { on: ["マイ"], kun: ["ごと"], meanings: ["every"], meanings_ko: ["매"], strokes: 6, jlpt: 5 },
  "週": { on: ["シュウ"], kun: [], meanings: ["week"], meanings_ko: ["주"], strokes: 11, jlpt: 5 },
  "半": { on: ["ハン"], kun: ["なか.ば"], meanings: ["half"], meanings_ko: ["절반"], strokes: 5, jlpt: 5 },
  "多": { on: ["タ"], kun: ["おお.い"], meanings: ["many", "much"], meanings_ko: ["많다"], strokes: 6, jlpt: 5 },
  "少": { on: ["ショウ"], kun: ["すく.ない", "すこ.し"], meanings: ["few", "little"], meanings_ko: ["적다", "조금"], strokes: 4, jlpt: 5 },
  "友": { on: ["ユウ"], kun: ["とも"], meanings: ["friend"], meanings_ko: ["친구"], strokes: 4, jlpt: 5 },
  "父": { on: ["フ"], kun: ["ちち"], meanings: ["father"], meanings_ko: ["아버지"], strokes: 4, jlpt: 5 },
  "母": { on: ["ボ"], kun: ["はは"], meanings: ["mother"], meanings_ko: ["어머니"], strokes: 5, jlpt: 5 },
  "手": { on: ["シュ"], kun: ["て"], meanings: ["hand"], meanings_ko: ["손"], strokes: 4, jlpt: 5 },
  "足": { on: ["ソク"], kun: ["あし", "た.りる"], meanings: ["foot", "leg", "enough"], meanings_ko: ["발", "다리", "충분하다"], strokes: 7, jlpt: 5 },
  "目": { on: ["モク", "ボク"], kun: ["め"], meanings: ["eye"], meanings_ko: ["눈"], strokes: 5, jlpt: 5 },
  "耳": { on: ["ジ"], kun: ["みみ"], meanings: ["ear"], meanings_ko: ["귀"], strokes: 6, jlpt: 5 },
  "口": { on: ["コウ", "ク"], kun: ["くち"], meanings: ["mouth"], meanings_ko: ["입"], strokes: 3, jlpt: 5 },
  "立": { on: ["リツ", "リュウ"], kun: ["た.つ", "た.てる"], meanings: ["stand"], meanings_ko: ["서다"], strokes: 5, jlpt: 5 },
  "言": { on: ["ゲン", "ゴン"], kun: ["い.う", "こと"], meanings: ["say", "word"], meanings_ko: ["말하다", "말"], strokes: 7, jlpt: 5 },

  // N4 Level Kanji
  "強": { on: ["キョウ", "ゴウ"], kun: ["つよ.い", "し.いる"], meanings: ["strong"], meanings_ko: ["강하다"], strokes: 11, jlpt: 4 },
  "弱": { on: ["ジャク"], kun: ["よわ.い", "よわ.る"], meanings: ["weak"], meanings_ko: ["약하다"], strokes: 10, jlpt: 4 },
  "思": { on: ["シ"], kun: ["おも.う"], meanings: ["think"], meanings_ko: ["생각하다"], strokes: 9, jlpt: 4 },
  "知": { on: ["チ"], kun: ["し.る"], meanings: ["know"], meanings_ko: ["알다"], strokes: 8, jlpt: 4 },
  "教": { on: ["キョウ"], kun: ["おし.える", "おそ.わる"], meanings: ["teach"], meanings_ko: ["가르치다"], strokes: 11, jlpt: 4 },
  "習": { on: ["シュウ"], kun: ["なら.う"], meanings: ["learn", "practice"], meanings_ko: ["익히다", "배우다"], strokes: 11, jlpt: 4 },
  "持": { on: ["ジ"], kun: ["も.つ"], meanings: ["hold", "have"], meanings_ko: ["가지다"], strokes: 9, jlpt: 4 },
  "待": { on: ["タイ"], kun: ["ま.つ"], meanings: ["wait"], meanings_ko: ["기다리다"], strokes: 9, jlpt: 4 },
  "使": { on: ["シ"], kun: ["つか.う"], meanings: ["use"], meanings_ko: ["사용하다"], strokes: 8, jlpt: 4 },
  "作": { on: ["サク", "サ"], kun: ["つく.る"], meanings: ["make", "create"], meanings_ko: ["만들다"], strokes: 7, jlpt: 4 },
  "始": { on: ["シ"], kun: ["はじ.める", "はじ.まる"], meanings: ["begin", "start"], meanings_ko: ["시작하다"], strokes: 8, jlpt: 4 },
  "終": { on: ["シュウ"], kun: ["お.わる", "お.える"], meanings: ["end", "finish"], meanings_ko: ["끝나다"], strokes: 11, jlpt: 4 },
  "開": { on: ["カイ"], kun: ["ひら.く", "あ.く"], meanings: ["open"], meanings_ko: ["열다"], strokes: 12, jlpt: 4 },
  "閉": { on: ["ヘイ"], kun: ["し.める", "と.じる"], meanings: ["close", "shut"], meanings_ko: ["닫다"], strokes: 11, jlpt: 4 },
  "走": { on: ["ソウ"], kun: ["はし.る"], meanings: ["run"], meanings_ko: ["달리다"], strokes: 7, jlpt: 4 },
  "歩": { on: ["ホ", "ブ", "フ"], kun: ["ある.く", "あゆ.む"], meanings: ["walk"], meanings_ko: ["걷다"], strokes: 8, jlpt: 4 },
  "止": { on: ["シ"], kun: ["と.まる", "と.める"], meanings: ["stop"], meanings_ko: ["멈추다"], strokes: 4, jlpt: 4 },
  "送": { on: ["ソウ"], kun: ["おく.る"], meanings: ["send"], meanings_ko: ["보내다"], strokes: 9, jlpt: 4 },

  // Additional N5/N4/N3 Kanji (commonly used)
  "私": { on: ["シ"], kun: ["わたくし", "わたし"], meanings: ["private", "I"], meanings_ko: ["나", "사사로운"], strokes: 7, jlpt: 5 },
  "彼": { on: ["ヒ"], kun: ["かれ", "かの"], meanings: ["he", "that"], meanings_ko: ["그", "저"], strokes: 8, jlpt: 4 },
  "勉": { on: ["ベン"], kun: ["つと.める"], meanings: ["exertion", "endeavor"], meanings_ko: ["힘쓰다"], strokes: 10, jlpt: 4 },
  "員": { on: ["イン"], kun: [], meanings: ["member", "employee"], meanings_ko: ["원", "사람"], strokes: 10, jlpt: 4 },
  "歌": { on: ["カ"], kun: ["うた", "うた.う"], meanings: ["song", "sing"], meanings_ko: ["노래", "노래하다"], strokes: 14, jlpt: 4 },
  "主": { on: ["シュ", "ス"], kun: ["ぬし", "おも"], meanings: ["master", "main"], meanings_ko: ["주인", "주"], strokes: 5, jlpt: 4 },
  "婦": { on: ["フ"], kun: ["よめ"], meanings: ["wife", "woman"], meanings_ko: ["아내", "여자"], strokes: 11, jlpt: 3 },
  "僕": { on: ["ボク"], kun: ["しもべ"], meanings: ["I", "servant"], meanings_ko: ["나", "종"], strokes: 14, jlpt: 3 },
  "浅": { on: ["セン"], kun: ["あさ.い"], meanings: ["shallow"], meanings_ko: ["얕다"], strokes: 9, jlpt: 3 },
  "草": { on: ["ソウ"], kun: ["くさ"], meanings: ["grass"], meanings_ko: ["풀"], strokes: 9, jlpt: 3 },
  "寺": { on: ["ジ"], kun: ["てら"], meanings: ["temple"], meanings_ko: ["절"], strokes: 6, jlpt: 3 },
  "遅": { on: ["チ"], kun: ["おく.れる", "おそ.い"], meanings: ["late", "slow"], meanings_ko: ["늦다"], strokes: 12, jlpt: 3 },
  "刻": { on: ["コク"], kun: ["きざ.む"], meanings: ["engrave", "time"], meanings_ko: ["새기다", "시각"], strokes: 8, jlpt: 3 },
  "罰": { on: ["バツ", "バチ"], kun: [], meanings: ["punishment"], meanings_ko: ["벌"], strokes: 14, jlpt: 2 },
  "掃": { on: ["ソウ"], kun: ["は.く"], meanings: ["sweep"], meanings_ko: ["쓸다"], strokes: 11, jlpt: 3 },
  "除": { on: ["ジョ", "ジ"], kun: ["のぞ.く"], meanings: ["remove", "exclude"], meanings_ko: ["제거하다"], strokes: 10, jlpt: 3 },
  "緑": { on: ["リョク", "ロク"], kun: ["みどり"], meanings: ["green"], meanings_ko: ["녹색"], strokes: 14, jlpt: 3 },
  "茶": { on: ["チャ", "サ"], kun: [], meanings: ["tea"], meanings_ko: ["차"], strokes: 9, jlpt: 4 },
  "明": { on: ["メイ", "ミョウ"], kun: ["あ.かり", "あか.るい", "あ.ける"], meanings: ["bright", "clear"], meanings_ko: ["밝다"], strokes: 8, jlpt: 4 },
  "家": { on: ["カ", "ケ"], kun: ["いえ", "や"], meanings: ["house", "home"], meanings_ko: ["집"], strokes: 10, jlpt: 4 },
  "族": { on: ["ゾク"], kun: [], meanings: ["tribe", "family"], meanings_ko: ["겨레", "족"], strokes: 11, jlpt: 4 },
  "初": { on: ["ショ"], kun: ["はじ.め", "はじ.めて", "はつ"], meanings: ["first", "beginning"], meanings_ko: ["처음"], strokes: 7, jlpt: 4 },
  "参": { on: ["サン"], kun: ["まい.る"], meanings: ["participate", "visit"], meanings_ko: ["참가하다"], strokes: 8, jlpt: 3 },
  "加": { on: ["カ"], kun: ["くわ.える", "くわ.わる"], meanings: ["add", "join"], meanings_ko: ["더하다"], strokes: 5, jlpt: 4 },
  "断": { on: ["ダン"], kun: ["た.つ", "ことわ.る"], meanings: ["cut", "refuse"], meanings_ko: ["끊다", "거절하다"], strokes: 11, jlpt: 3 },
  "有": { on: ["ユウ", "ウ"], kun: ["あ.る"], meanings: ["have", "exist"], meanings_ko: ["있다"], strokes: 6, jlpt: 4 },
  "孤": { on: ["コ"], kun: [], meanings: ["lonely", "alone"], meanings_ko: ["외롭다"], strokes: 8, jlpt: 2 },
  "独": { on: ["ドク", "トク"], kun: ["ひと.り"], meanings: ["alone", "single"], meanings_ko: ["홀로"], strokes: 9, jlpt: 3 },
  "感": { on: ["カン"], kun: [], meanings: ["feeling", "emotion"], meanings_ko: ["느끼다"], strokes: 13, jlpt: 3 },
  "頑": { on: ["ガン"], kun: ["かたく"], meanings: ["stubborn"], meanings_ko: ["완고하다"], strokes: 13, jlpt: 3 },
  "張": { on: ["チョウ"], kun: ["は.る"], meanings: ["stretch", "spread"], meanings_ko: ["펴다"], strokes: 11, jlpt: 3 },
  "給": { on: ["キュウ"], kun: ["たま.う"], meanings: ["salary", "supply"], meanings_ko: ["급여", "주다"], strokes: 12, jlpt: 3 },
  "料": { on: ["リョウ"], kun: [], meanings: ["fee", "material"], meanings_ko: ["요금", "재료"], strokes: 10, jlpt: 4 },
  "緒": { on: ["ショ", "チョ"], kun: ["お"], meanings: ["cord", "beginning"], meanings_ko: ["실마리"], strokes: 14, jlpt: 3 },
  "練": { on: ["レン"], kun: ["ね.る"], meanings: ["practice", "train"], meanings_ko: ["익히다"], strokes: 14, jlpt: 4 },
  "廊": { on: ["ロウ"], kun: [], meanings: ["corridor"], meanings_ko: ["복도"], strokes: 12, jlpt: 3 },
  "若": { on: ["ジャク", "ニャク"], kun: ["わか.い", "も.しくは"], meanings: ["young"], meanings_ko: ["젊다"], strokes: 8, jlpt: 4 },
  "忘": { on: ["ボウ"], kun: ["わす.れる"], meanings: ["forget"], meanings_ko: ["잊다"], strokes: 7, jlpt: 4 },
  "傘": { on: ["サン"], kun: ["かさ"], meanings: ["umbrella"], meanings_ko: ["우산"], strokes: 12, jlpt: 3 },
  "渡": { on: ["ト"], kun: ["わた.る", "わた.す"], meanings: ["cross", "hand over"], meanings_ko: ["건너다", "건네다"], strokes: 12, jlpt: 3 },
  "曜": { on: ["ヨウ"], kun: [], meanings: ["day of week"], meanings_ko: ["요일"], strokes: 18, jlpt: 4 },
  "銀": { on: ["ギン"], kun: [], meanings: ["silver"], meanings_ko: ["은"], strokes: 14, jlpt: 4 },
  "泳": { on: ["エイ"], kun: ["およ.ぐ"], meanings: ["swim"], meanings_ko: ["수영하다"], strokes: 8, jlpt: 4 },
  "魚": { on: ["ギョ"], kun: ["うお", "さかな"], meanings: ["fish"], meanings_ko: ["물고기"], strokes: 11, jlpt: 4 },
  "桜": { on: ["オウ"], kun: ["さくら"], meanings: ["cherry blossom"], meanings_ko: ["벚꽃"], strokes: 10, jlpt: 3 },
  "咲": { on: ["ショウ"], kun: ["さ.く"], meanings: ["bloom"], meanings_ko: ["피다"], strokes: 9, jlpt: 3 },
  "忙": { on: ["ボウ", "モウ"], kun: ["いそが.しい"], meanings: ["busy"], meanings_ko: ["바쁘다"], strokes: 6, jlpt: 4 },
  "韓": { on: ["カン"], kun: [], meanings: ["Korea"], meanings_ko: ["한국"], strokes: 18, jlpt: 3 },
  "音": { on: ["オン", "イン"], kun: ["おと", "ね"], meanings: ["sound"], meanings_ko: ["소리"], strokes: 9, jlpt: 4 },
  "楽": { on: ["ガク", "ラク"], kun: ["たの.しい"], meanings: ["music", "enjoy"], meanings_ko: ["음악", "즐겁다"], strokes: 13, jlpt: 4 },
  "机": { on: ["キ"], kun: ["つくえ"], meanings: ["desk"], meanings_ko: ["책상"], strokes: 6, jlpt: 5 },
  "質": { on: ["シツ", "シチ"], kun: ["たち"], meanings: ["quality", "nature"], meanings_ko: ["질", "바탕"], strokes: 15, jlpt: 3 },
  "問": { on: ["モン"], kun: ["と.う", "とん"], meanings: ["question"], meanings_ko: ["묻다"], strokes: 11, jlpt: 4 },
  "答": { on: ["トウ"], kun: ["こた.える", "こた.え"], meanings: ["answer"], meanings_ko: ["대답하다"], strokes: 12, jlpt: 4 },
  "理": { on: ["リ"], kun: [], meanings: ["reason", "logic"], meanings_ko: ["이치"], strokes: 11, jlpt: 4 },
  "解": { on: ["カイ", "ゲ"], kun: ["と.く", "わか.る"], meanings: ["understand", "solve"], meanings_ko: ["풀다", "이해하다"], strokes: 13, jlpt: 3 },
  "正": { on: ["セイ", "ショウ"], kun: ["ただ.しい", "まさ"], meanings: ["correct", "right"], meanings_ko: ["바르다"], strokes: 5, jlpt: 4 },
  "物": { on: ["ブツ", "モツ"], kun: ["もの"], meanings: ["thing"], meanings_ko: ["물건"], strokes: 8, jlpt: 4 },
  "事": { on: ["ジ", "ズ"], kun: ["こと"], meanings: ["matter", "thing"], meanings_ko: ["일"], strokes: 8, jlpt: 4 },
  "仕": { on: ["シ", "ジ"], kun: ["つか.える"], meanings: ["serve", "work"], meanings_ko: ["섬기다"], strokes: 5, jlpt: 4 },
  "洗": { on: ["セン"], kun: ["あら.う"], meanings: ["wash"], meanings_ko: ["씻다"], strokes: 9, jlpt: 4 },
  "着": { on: ["チャク", "ジャク"], kun: ["き.る", "つ.く"], meanings: ["wear", "arrive"], meanings_ko: ["입다", "도착하다"], strokes: 12, jlpt: 4 },
  "売": { on: ["バイ"], kun: ["う.る", "う.れる"], meanings: ["sell"], meanings_ko: ["팔다"], strokes: 7, jlpt: 4 },
  "春": { on: ["シュン"], kun: ["はる"], meanings: ["spring"], meanings_ko: ["봄"], strokes: 9, jlpt: 4 },
  "夏": { on: ["カ", "ゲ"], kun: ["なつ"], meanings: ["summer"], meanings_ko: ["여름"], strokes: 10, jlpt: 4 },
  "秋": { on: ["シュウ"], kun: ["あき"], meanings: ["autumn"], meanings_ko: ["가을"], strokes: 9, jlpt: 4 },
  "冬": { on: ["トウ"], kun: ["ふゆ"], meanings: ["winter"], meanings_ko: ["겨울"], strokes: 5, jlpt: 4 },
  "海": { on: ["カイ"], kun: ["うみ"], meanings: ["sea", "ocean"], meanings_ko: ["바다"], strokes: 9, jlpt: 4 },
  "池": { on: ["チ"], kun: ["いけ"], meanings: ["pond"], meanings_ko: ["연못"], strokes: 6, jlpt: 3 },
  "林": { on: ["リン"], kun: ["はやし"], meanings: ["grove", "forest"], meanings_ko: ["수풀"], strokes: 8, jlpt: 3 },
  "森": { on: ["シン"], kun: ["もり"], meanings: ["forest"], meanings_ko: ["숲"], strokes: 12, jlpt: 3 },
  "空": { on: ["クウ"], kun: ["そら", "あ.く", "から"], meanings: ["sky", "empty"], meanings_ko: ["하늘", "비다"], strokes: 8, jlpt: 4 },
  "風": { on: ["フウ", "フ"], kun: ["かぜ", "かざ"], meanings: ["wind", "style"], meanings_ko: ["바람"], strokes: 9, jlpt: 4 },
  "雪": { on: ["セツ"], kun: ["ゆき"], meanings: ["snow"], meanings_ko: ["눈"], strokes: 11, jlpt: 3 },
  "晴": { on: ["セイ"], kun: ["は.れる", "は.らす"], meanings: ["clear up"], meanings_ko: ["개다"], strokes: 12, jlpt: 3 },
  "曇": { on: ["ドン"], kun: ["くも.る"], meanings: ["cloudy"], meanings_ko: ["흐리다"], strokes: 16, jlpt: 3 },
  "病": { on: ["ビョウ", "ヘイ"], kun: ["や.む", "やまい"], meanings: ["sick", "disease"], meanings_ko: ["병", "아프다"], strokes: 10, jlpt: 4 },
  "院": { on: ["イン"], kun: [], meanings: ["institution", "temple"], meanings_ko: ["원"], strokes: 10, jlpt: 4 },
  "医": { on: ["イ"], kun: [], meanings: ["doctor", "medicine"], meanings_ko: ["의사", "의학"], strokes: 7, jlpt: 4 },
  "者": { on: ["シャ"], kun: ["もの"], meanings: ["person"], meanings_ko: ["사람"], strokes: 8, jlpt: 4 },
  "薬": { on: ["ヤク"], kun: ["くすり"], meanings: ["medicine", "drug"], meanings_ko: ["약"], strokes: 16, jlpt: 3 },
  "死": { on: ["シ"], kun: ["し.ぬ"], meanings: ["death", "die"], meanings_ko: ["죽다"], strokes: 6, jlpt: 4 },
  "写": { on: ["シャ"], kun: ["うつ.す", "うつ.る"], meanings: ["copy", "photograph"], meanings_ko: ["베끼다", "찍다"], strokes: 5, jlpt: 4 },
  "真": { on: ["シン"], kun: ["ま", "まこと"], meanings: ["true", "reality"], meanings_ko: ["참", "진실"], strokes: 10, jlpt: 4 },
  "画": { on: ["ガ", "カク"], kun: [], meanings: ["picture", "drawing"], meanings_ko: ["그림"], strokes: 8, jlpt: 4 },
  "映": { on: ["エイ"], kun: ["うつ.る", "は.える"], meanings: ["reflect", "project"], meanings_ko: ["비치다"], strokes: 9, jlpt: 4 },
  "動": { on: ["ドウ"], kun: ["うご.く", "うご.かす"], meanings: ["move"], meanings_ko: ["움직이다"], strokes: 11, jlpt: 4 },
  "働": { on: ["ドウ"], kun: ["はたら.く"], meanings: ["work"], meanings_ko: ["일하다"], strokes: 13, jlpt: 4 },
  "運": { on: ["ウン"], kun: ["はこ.ぶ"], meanings: ["carry", "luck"], meanings_ko: ["나르다", "운"], strokes: 12, jlpt: 4 },
  "転": { on: ["テン"], kun: ["ころ.がる", "ころ.げる"], meanings: ["revolve", "turn"], meanings_ko: ["구르다"], strokes: 11, jlpt: 4 },
  "届": { on: ["カイ"], kun: ["とど.く", "とど.ける"], meanings: ["deliver", "reach"], meanings_ko: ["닿다", "배달하다"], strokes: 8, jlpt: 3 },
};

/**
 * Check if a character is a kanji
 */
export function isKanji(char: string): boolean {
  if (char.length !== 1) return false;
  const code = char.charCodeAt(0);
  // CJK Unified Ideographs (most common kanji)
  if (code >= 0x4E00 && code <= 0x9FFF) return true;
  // CJK Unified Ideographs Extension A
  if (code >= 0x3400 && code <= 0x4DBF) return true;
  return false;
}

/**
 * Extract unique kanji characters from text
 */
export function extractKanjiFromText(text: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const char of text) {
    if (isKanji(char) && !seen.has(char)) {
      seen.add(char);
      result.push(char);
    }
  }
  return result;
}

/**
 * Get information about a kanji character
 */
export function getKanjiInfo(character: string): KanjiInfo | null {
  if (!isKanji(character)) return null;

  const info = KANJI_DICT[character];
  if (info) {
    return {
      character,
      on_readings: info.on,
      kun_readings: info.kun,
      meanings: info.meanings,
      meanings_ko: info.meanings_ko,
      strokes: info.strokes,
      jlpt_level: info.jlpt,
    };
  }

  // Return basic info for unknown kanji
  return {
    character,
    on_readings: [],
    kun_readings: [],
    meanings: [],
    meanings_ko: [],
    strokes: 0,
    jlpt_level: 0,
  };
}

/**
 * Analyze all kanji in a word
 */
export function analyzeKanjiInWord(word: string): KanjiInfo[] {
  const kanjiChars = extractKanjiFromText(word);
  return kanjiChars
    .map((char) => getKanjiInfo(char))
    .filter((info): info is KanjiInfo => info !== null);
}

/**
 * Get all kanji by JLPT level
 */
export function getKanjiByLevel(level: number): KanjiInfo[] {
  return Object.entries(KANJI_DICT)
    .filter(([, info]) => info.jlpt === level)
    .map(([char, info]) => ({
      character: char,
      on_readings: info.on,
      kun_readings: info.kun,
      meanings: info.meanings,
      meanings_ko: info.meanings_ko,
      strokes: info.strokes,
      jlpt_level: info.jlpt,
    }));
}

/**
 * Get all available kanji
 */
export function getAllKanji(): KanjiInfo[] {
  return Object.entries(KANJI_DICT).map(([char, info]) => ({
    character: char,
    on_readings: info.on,
    kun_readings: info.kun,
    meanings: info.meanings,
    meanings_ko: info.meanings_ko,
    strokes: info.strokes,
    jlpt_level: info.jlpt,
  }));
}

/**
 * Get total kanji count
 */
export function getKanjiCount(): number {
  return Object.keys(KANJI_DICT).length;
}
