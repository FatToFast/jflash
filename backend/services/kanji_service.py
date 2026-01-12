"""Kanji extraction and information service.

Provides functionality to:
- Extract kanji characters from Japanese text
- Look up kanji information (readings, meanings, stroke count)
- Use a built-in kanji dictionary for common kanji

Design Notes:
- KANJI_DICT is an in-memory dictionary for fast lookup
- Currently contains ~100+ N5/N4 kanji
- Extensibility options:
  1. Load from external JSON file at startup
  2. Migrate to database (Kanji model exists but unused)
  3. Use external API (JMdict, KanjiVG)
- extract_kanji_from_text() returns UNIQUE kanji only (deduplicated)
"""

import re
import unicodedata
from typing import Optional

# Common kanji dictionary with readings and meanings
# Structure: { "字": { on, kun, meanings, meanings_ko, strokes, jlpt } }
# Note: Dictionary size is accessed via len(KANJI_DICT) for accurate stats
KANJI_DICT: dict[str, dict] = {
    # N5 Level Kanji (Basic)
    "一": {"on": ["イチ", "イツ"], "kun": ["ひと", "ひと.つ"], "meanings": ["one"], "meanings_ko": ["하나", "일"], "strokes": 1, "jlpt": 5},
    "二": {"on": ["ニ", "ジ"], "kun": ["ふた", "ふた.つ"], "meanings": ["two"], "meanings_ko": ["둘", "이"], "strokes": 2, "jlpt": 5},
    "三": {"on": ["サン", "ゾウ"], "kun": ["み", "み.つ"], "meanings": ["three"], "meanings_ko": ["셋", "삼"], "strokes": 3, "jlpt": 5},
    "四": {"on": ["シ"], "kun": ["よ", "よ.つ", "よん"], "meanings": ["four"], "meanings_ko": ["넷", "사"], "strokes": 5, "jlpt": 5},
    "五": {"on": ["ゴ"], "kun": ["いつ", "いつ.つ"], "meanings": ["five"], "meanings_ko": ["다섯", "오"], "strokes": 4, "jlpt": 5},
    "六": {"on": ["ロク", "リク"], "kun": ["む", "む.つ", "むい"], "meanings": ["six"], "meanings_ko": ["여섯", "육"], "strokes": 4, "jlpt": 5},
    "七": {"on": ["シチ"], "kun": ["なな", "なな.つ", "なの"], "meanings": ["seven"], "meanings_ko": ["일곱", "칠"], "strokes": 2, "jlpt": 5},
    "八": {"on": ["ハチ"], "kun": ["や", "や.つ", "やっ.つ"], "meanings": ["eight"], "meanings_ko": ["여덟", "팔"], "strokes": 2, "jlpt": 5},
    "九": {"on": ["キュウ", "ク"], "kun": ["ここの", "ここの.つ"], "meanings": ["nine"], "meanings_ko": ["아홉", "구"], "strokes": 2, "jlpt": 5},
    "十": {"on": ["ジュウ", "ジッ"], "kun": ["とお", "と"], "meanings": ["ten"], "meanings_ko": ["열", "십"], "strokes": 2, "jlpt": 5},
    "百": {"on": ["ヒャク", "ビャク"], "kun": ["もも"], "meanings": ["hundred"], "meanings_ko": ["백"], "strokes": 6, "jlpt": 5},
    "千": {"on": ["セン"], "kun": ["ち"], "meanings": ["thousand"], "meanings_ko": ["천"], "strokes": 3, "jlpt": 5},
    "万": {"on": ["マン", "バン"], "kun": ["よろず"], "meanings": ["ten thousand"], "meanings_ko": ["만"], "strokes": 3, "jlpt": 5},
    "円": {"on": ["エン"], "kun": ["まる.い"], "meanings": ["circle", "yen"], "meanings_ko": ["엔", "원"], "strokes": 4, "jlpt": 5},
    "日": {"on": ["ニチ", "ジツ"], "kun": ["ひ", "か"], "meanings": ["day", "sun", "Japan"], "meanings_ko": ["날", "해", "일본"], "strokes": 4, "jlpt": 5},
    "月": {"on": ["ゲツ", "ガツ"], "kun": ["つき"], "meanings": ["month", "moon"], "meanings_ko": ["달", "월"], "strokes": 4, "jlpt": 5},
    "火": {"on": ["カ"], "kun": ["ひ", "ほ"], "meanings": ["fire"], "meanings_ko": ["불"], "strokes": 4, "jlpt": 5},
    "水": {"on": ["スイ"], "kun": ["みず"], "meanings": ["water"], "meanings_ko": ["물"], "strokes": 4, "jlpt": 5},
    "木": {"on": ["ボク", "モク"], "kun": ["き", "こ"], "meanings": ["tree", "wood"], "meanings_ko": ["나무"], "strokes": 4, "jlpt": 5},
    "金": {"on": ["キン", "コン", "ゴン"], "kun": ["かね", "かな"], "meanings": ["gold", "money"], "meanings_ko": ["금", "돈"], "strokes": 8, "jlpt": 5},
    "土": {"on": ["ド", "ト"], "kun": ["つち"], "meanings": ["earth", "soil"], "meanings_ko": ["흙", "땅"], "strokes": 3, "jlpt": 5},
    "年": {"on": ["ネン"], "kun": ["とし"], "meanings": ["year"], "meanings_ko": ["해", "년"], "strokes": 6, "jlpt": 5},
    "時": {"on": ["ジ"], "kun": ["とき"], "meanings": ["time", "hour"], "meanings_ko": ["때", "시"], "strokes": 10, "jlpt": 5},
    "分": {"on": ["ブン", "フン", "ブ"], "kun": ["わ.ける", "わ.かる"], "meanings": ["minute", "part"], "meanings_ko": ["분", "나누다"], "strokes": 4, "jlpt": 5},
    "人": {"on": ["ジン", "ニン"], "kun": ["ひと"], "meanings": ["person"], "meanings_ko": ["사람"], "strokes": 2, "jlpt": 5},
    "子": {"on": ["シ", "ス"], "kun": ["こ"], "meanings": ["child"], "meanings_ko": ["아이", "자"], "strokes": 3, "jlpt": 5},
    "女": {"on": ["ジョ", "ニョ"], "kun": ["おんな", "め"], "meanings": ["woman", "female"], "meanings_ko": ["여자"], "strokes": 3, "jlpt": 5},
    "男": {"on": ["ダン", "ナン"], "kun": ["おとこ"], "meanings": ["man", "male"], "meanings_ko": ["남자"], "strokes": 7, "jlpt": 5},
    "山": {"on": ["サン", "セン"], "kun": ["やま"], "meanings": ["mountain"], "meanings_ko": ["산"], "strokes": 3, "jlpt": 5},
    "川": {"on": ["セン"], "kun": ["かわ"], "meanings": ["river"], "meanings_ko": ["강"], "strokes": 3, "jlpt": 5},
    "田": {"on": ["デン"], "kun": ["た"], "meanings": ["rice field"], "meanings_ko": ["논", "밭"], "strokes": 5, "jlpt": 5},
    "本": {"on": ["ホン"], "kun": ["もと"], "meanings": ["book", "origin"], "meanings_ko": ["책", "근본"], "strokes": 5, "jlpt": 5},
    "学": {"on": ["ガク"], "kun": ["まな.ぶ"], "meanings": ["learn", "study"], "meanings_ko": ["배우다", "학"], "strokes": 8, "jlpt": 5},
    "校": {"on": ["コウ", "キョウ"], "kun": [], "meanings": ["school"], "meanings_ko": ["학교"], "strokes": 10, "jlpt": 5},
    "生": {"on": ["セイ", "ショウ"], "kun": ["い.きる", "う.まれる", "なま"], "meanings": ["life", "birth", "raw"], "meanings_ko": ["살다", "태어나다", "날것"], "strokes": 5, "jlpt": 5},
    "先": {"on": ["セン"], "kun": ["さき", "ま.ず"], "meanings": ["previous", "ahead"], "meanings_ko": ["먼저", "앞"], "strokes": 6, "jlpt": 5},
    "語": {"on": ["ゴ"], "kun": ["かた.る", "かた.らう"], "meanings": ["language", "word"], "meanings_ko": ["말", "언어"], "strokes": 14, "jlpt": 5},
    "読": {"on": ["ドク", "トク", "トウ"], "kun": ["よ.む"], "meanings": ["read"], "meanings_ko": ["읽다"], "strokes": 14, "jlpt": 5},
    "書": {"on": ["ショ"], "kun": ["か.く"], "meanings": ["write"], "meanings_ko": ["쓰다"], "strokes": 10, "jlpt": 5},
    "話": {"on": ["ワ"], "kun": ["はな.す", "はなし"], "meanings": ["talk", "speak"], "meanings_ko": ["말하다", "이야기"], "strokes": 13, "jlpt": 5},
    "聞": {"on": ["ブン", "モン"], "kun": ["き.く", "き.こえる"], "meanings": ["hear", "listen"], "meanings_ko": ["듣다"], "strokes": 14, "jlpt": 5},
    "見": {"on": ["ケン"], "kun": ["み.る", "み.える"], "meanings": ["see", "look"], "meanings_ko": ["보다"], "strokes": 7, "jlpt": 5},
    "食": {"on": ["ショク", "ジキ"], "kun": ["た.べる", "く.う"], "meanings": ["eat", "food"], "meanings_ko": ["먹다", "음식"], "strokes": 9, "jlpt": 5},
    "飲": {"on": ["イン", "オン"], "kun": ["の.む"], "meanings": ["drink"], "meanings_ko": ["마시다"], "strokes": 12, "jlpt": 5},
    "行": {"on": ["コウ", "ギョウ", "アン"], "kun": ["い.く", "ゆ.く", "おこな.う"], "meanings": ["go", "conduct"], "meanings_ko": ["가다", "행하다"], "strokes": 6, "jlpt": 5},
    "来": {"on": ["ライ", "タイ"], "kun": ["く.る", "きた.る"], "meanings": ["come"], "meanings_ko": ["오다"], "strokes": 7, "jlpt": 5},
    "出": {"on": ["シュツ", "スイ"], "kun": ["で.る", "だ.す"], "meanings": ["exit", "leave"], "meanings_ko": ["나가다", "나오다"], "strokes": 5, "jlpt": 5},
    "入": {"on": ["ニュウ", "ジュ"], "kun": ["い.る", "はい.る"], "meanings": ["enter"], "meanings_ko": ["들어가다"], "strokes": 2, "jlpt": 5},
    "休": {"on": ["キュウ"], "kun": ["やす.む", "やす.まる"], "meanings": ["rest"], "meanings_ko": ["쉬다"], "strokes": 6, "jlpt": 5},
    "買": {"on": ["バイ"], "kun": ["か.う"], "meanings": ["buy"], "meanings_ko": ["사다"], "strokes": 12, "jlpt": 5},
    "高": {"on": ["コウ"], "kun": ["たか.い", "たか"], "meanings": ["tall", "high", "expensive"], "meanings_ko": ["높다", "비싸다"], "strokes": 10, "jlpt": 5},
    "安": {"on": ["アン"], "kun": ["やす.い", "やす"], "meanings": ["cheap", "peaceful"], "meanings_ko": ["싸다", "편안하다"], "strokes": 6, "jlpt": 5},
    "新": {"on": ["シン"], "kun": ["あたら.しい", "あら.た", "にい"], "meanings": ["new"], "meanings_ko": ["새롭다"], "strokes": 13, "jlpt": 5},
    "古": {"on": ["コ"], "kun": ["ふる.い", "ふる"], "meanings": ["old"], "meanings_ko": ["오래되다", "낡다"], "strokes": 5, "jlpt": 5},
    "大": {"on": ["ダイ", "タイ"], "kun": ["おお.きい", "おお"], "meanings": ["big", "large"], "meanings_ko": ["크다"], "strokes": 3, "jlpt": 5},
    "小": {"on": ["ショウ"], "kun": ["ちい.さい", "こ", "お"], "meanings": ["small", "little"], "meanings_ko": ["작다"], "strokes": 3, "jlpt": 5},
    "長": {"on": ["チョウ"], "kun": ["なが.い", "おさ"], "meanings": ["long", "chief"], "meanings_ko": ["길다", "우두머리"], "strokes": 8, "jlpt": 5},
    "短": {"on": ["タン"], "kun": ["みじか.い"], "meanings": ["short"], "meanings_ko": ["짧다"], "strokes": 12, "jlpt": 5},
    "白": {"on": ["ハク", "ビャク"], "kun": ["しろ", "しら", "しろ.い"], "meanings": ["white"], "meanings_ko": ["흰색", "하얗다"], "strokes": 5, "jlpt": 5},
    "黒": {"on": ["コク"], "kun": ["くろ", "くろ.い"], "meanings": ["black"], "meanings_ko": ["검정", "검다"], "strokes": 11, "jlpt": 5},
    "赤": {"on": ["セキ", "シャク"], "kun": ["あか", "あか.い"], "meanings": ["red"], "meanings_ko": ["빨강", "빨갛다"], "strokes": 7, "jlpt": 5},
    "青": {"on": ["セイ", "ショウ"], "kun": ["あお", "あお.い"], "meanings": ["blue", "green"], "meanings_ko": ["파랑", "초록"], "strokes": 8, "jlpt": 5},
    "車": {"on": ["シャ"], "kun": ["くるま"], "meanings": ["car", "vehicle"], "meanings_ko": ["차", "자동차"], "strokes": 7, "jlpt": 5},
    "電": {"on": ["デン"], "kun": [], "meanings": ["electricity"], "meanings_ko": ["전기"], "strokes": 13, "jlpt": 5},
    "駅": {"on": ["エキ"], "kun": [], "meanings": ["station"], "meanings_ko": ["역"], "strokes": 14, "jlpt": 5},
    "道": {"on": ["ドウ", "トウ"], "kun": ["みち"], "meanings": ["road", "way"], "meanings_ko": ["길"], "strokes": 12, "jlpt": 5},
    "北": {"on": ["ホク"], "kun": ["きた"], "meanings": ["north"], "meanings_ko": ["북쪽"], "strokes": 5, "jlpt": 5},
    "南": {"on": ["ナン", "ナ"], "kun": ["みなみ"], "meanings": ["south"], "meanings_ko": ["남쪽"], "strokes": 9, "jlpt": 5},
    "東": {"on": ["トウ"], "kun": ["ひがし"], "meanings": ["east"], "meanings_ko": ["동쪽"], "strokes": 8, "jlpt": 5},
    "西": {"on": ["セイ", "サイ"], "kun": ["にし"], "meanings": ["west"], "meanings_ko": ["서쪽"], "strokes": 6, "jlpt": 5},
    "右": {"on": ["ウ", "ユウ"], "kun": ["みぎ"], "meanings": ["right"], "meanings_ko": ["오른쪽"], "strokes": 5, "jlpt": 5},
    "左": {"on": ["サ", "シャ"], "kun": ["ひだり"], "meanings": ["left"], "meanings_ko": ["왼쪽"], "strokes": 5, "jlpt": 5},
    "上": {"on": ["ジョウ", "ショウ"], "kun": ["うえ", "あ.がる", "のぼ.る"], "meanings": ["up", "above"], "meanings_ko": ["위"], "strokes": 3, "jlpt": 5},
    "下": {"on": ["カ", "ゲ"], "kun": ["した", "さ.がる", "くだ.る"], "meanings": ["down", "below"], "meanings_ko": ["아래"], "strokes": 3, "jlpt": 5},
    "中": {"on": ["チュウ"], "kun": ["なか"], "meanings": ["middle", "inside"], "meanings_ko": ["안", "가운데"], "strokes": 4, "jlpt": 5},
    "外": {"on": ["ガイ", "ゲ"], "kun": ["そと", "ほか", "はず.す"], "meanings": ["outside"], "meanings_ko": ["밖"], "strokes": 5, "jlpt": 5},
    "前": {"on": ["ゼン"], "kun": ["まえ"], "meanings": ["front", "before"], "meanings_ko": ["앞"], "strokes": 9, "jlpt": 5},
    "後": {"on": ["ゴ", "コウ"], "kun": ["うし.ろ", "あと", "のち"], "meanings": ["behind", "after"], "meanings_ko": ["뒤"], "strokes": 9, "jlpt": 5},
    "午": {"on": ["ゴ"], "kun": ["うま"], "meanings": ["noon"], "meanings_ko": ["정오"], "strokes": 4, "jlpt": 5},
    "今": {"on": ["コン", "キン"], "kun": ["いま"], "meanings": ["now"], "meanings_ko": ["지금"], "strokes": 4, "jlpt": 5},
    "何": {"on": ["カ"], "kun": ["なに", "なん"], "meanings": ["what"], "meanings_ko": ["무엇"], "strokes": 7, "jlpt": 5},
    "名": {"on": ["メイ", "ミョウ"], "kun": ["な"], "meanings": ["name"], "meanings_ko": ["이름"], "strokes": 6, "jlpt": 5},
    "国": {"on": ["コク"], "kun": ["くに"], "meanings": ["country"], "meanings_ko": ["나라"], "strokes": 8, "jlpt": 5},
    "天": {"on": ["テン"], "kun": ["あまつ", "あめ", "あま"], "meanings": ["heaven", "sky"], "meanings_ko": ["하늘"], "strokes": 4, "jlpt": 5},
    "気": {"on": ["キ", "ケ"], "kun": [], "meanings": ["spirit", "air"], "meanings_ko": ["기운", "공기"], "strokes": 6, "jlpt": 5},
    "雨": {"on": ["ウ"], "kun": ["あめ", "あま"], "meanings": ["rain"], "meanings_ko": ["비"], "strokes": 8, "jlpt": 5},
    "花": {"on": ["カ", "ケ"], "kun": ["はな"], "meanings": ["flower"], "meanings_ko": ["꽃"], "strokes": 7, "jlpt": 5},
    "店": {"on": ["テン"], "kun": ["みせ"], "meanings": ["store", "shop"], "meanings_ko": ["가게"], "strokes": 8, "jlpt": 5},
    "社": {"on": ["シャ"], "kun": ["やしろ"], "meanings": ["company", "shrine"], "meanings_ko": ["회사", "신사"], "strokes": 7, "jlpt": 5},
    "会": {"on": ["カイ", "エ"], "kun": ["あ.う"], "meanings": ["meet", "society"], "meanings_ko": ["만나다", "회"], "strokes": 6, "jlpt": 5},
    "毎": {"on": ["マイ"], "kun": ["ごと"], "meanings": ["every"], "meanings_ko": ["매"], "strokes": 6, "jlpt": 5},
    "週": {"on": ["シュウ"], "kun": [], "meanings": ["week"], "meanings_ko": ["주"], "strokes": 11, "jlpt": 5},
    "半": {"on": ["ハン"], "kun": ["なか.ば"], "meanings": ["half"], "meanings_ko": ["절반"], "strokes": 5, "jlpt": 5},
    "多": {"on": ["タ"], "kun": ["おお.い"], "meanings": ["many", "much"], "meanings_ko": ["많다"], "strokes": 6, "jlpt": 5},
    "少": {"on": ["ショウ"], "kun": ["すく.ない", "すこ.し"], "meanings": ["few", "little"], "meanings_ko": ["적다", "조금"], "strokes": 4, "jlpt": 5},
    "友": {"on": ["ユウ"], "kun": ["とも"], "meanings": ["friend"], "meanings_ko": ["친구"], "strokes": 4, "jlpt": 5},
    "父": {"on": ["フ"], "kun": ["ちち"], "meanings": ["father"], "meanings_ko": ["아버지"], "strokes": 4, "jlpt": 5},
    "母": {"on": ["ボ"], "kun": ["はは"], "meanings": ["mother"], "meanings_ko": ["어머니"], "strokes": 5, "jlpt": 5},
    "手": {"on": ["シュ"], "kun": ["て"], "meanings": ["hand"], "meanings_ko": ["손"], "strokes": 4, "jlpt": 5},
    "足": {"on": ["ソク"], "kun": ["あし", "た.りる"], "meanings": ["foot", "leg", "enough"], "meanings_ko": ["발", "다리", "충분하다"], "strokes": 7, "jlpt": 5},
    "目": {"on": ["モク", "ボク"], "kun": ["め"], "meanings": ["eye"], "meanings_ko": ["눈"], "strokes": 5, "jlpt": 5},
    "耳": {"on": ["ジ"], "kun": ["みみ"], "meanings": ["ear"], "meanings_ko": ["귀"], "strokes": 6, "jlpt": 5},
    "口": {"on": ["コウ", "ク"], "kun": ["くち"], "meanings": ["mouth"], "meanings_ko": ["입"], "strokes": 3, "jlpt": 5},
    "立": {"on": ["リツ", "リュウ"], "kun": ["た.つ", "た.てる"], "meanings": ["stand"], "meanings_ko": ["서다"], "strokes": 5, "jlpt": 5},
    "言": {"on": ["ゲン", "ゴン"], "kun": ["い.う", "こと"], "meanings": ["say", "word"], "meanings_ko": ["말하다", "말"], "strokes": 7, "jlpt": 5},

    # Some N4 Level Kanji
    "強": {"on": ["キョウ", "ゴウ"], "kun": ["つよ.い", "し.いる"], "meanings": ["strong"], "meanings_ko": ["강하다"], "strokes": 11, "jlpt": 4},
    "弱": {"on": ["ジャク"], "kun": ["よわ.い", "よわ.る"], "meanings": ["weak"], "meanings_ko": ["약하다"], "strokes": 10, "jlpt": 4},
    "思": {"on": ["シ"], "kun": ["おも.う"], "meanings": ["think"], "meanings_ko": ["생각하다"], "strokes": 9, "jlpt": 4},
    "知": {"on": ["チ"], "kun": ["し.る"], "meanings": ["know"], "meanings_ko": ["알다"], "strokes": 8, "jlpt": 4},
    "教": {"on": ["キョウ"], "kun": ["おし.える", "おそ.わる"], "meanings": ["teach"], "meanings_ko": ["가르치다"], "strokes": 11, "jlpt": 4},
    "習": {"on": ["シュウ"], "kun": ["なら.う"], "meanings": ["learn", "practice"], "meanings_ko": ["익히다", "배우다"], "strokes": 11, "jlpt": 4},
    "持": {"on": ["ジ"], "kun": ["も.つ"], "meanings": ["hold", "have"], "meanings_ko": ["가지다"], "strokes": 9, "jlpt": 4},
    "待": {"on": ["タイ"], "kun": ["ま.つ"], "meanings": ["wait"], "meanings_ko": ["기다리다"], "strokes": 9, "jlpt": 4},
    "使": {"on": ["シ"], "kun": ["つか.う"], "meanings": ["use"], "meanings_ko": ["사용하다"], "strokes": 8, "jlpt": 4},
    "作": {"on": ["サク", "サ"], "kun": ["つく.る"], "meanings": ["make", "create"], "meanings_ko": ["만들다"], "strokes": 7, "jlpt": 4},
    "始": {"on": ["シ"], "kun": ["はじ.める", "はじ.まる"], "meanings": ["begin", "start"], "meanings_ko": ["시작하다"], "strokes": 8, "jlpt": 4},
    "終": {"on": ["シュウ"], "kun": ["お.わる", "お.える"], "meanings": ["end", "finish"], "meanings_ko": ["끝나다"], "strokes": 11, "jlpt": 4},
    "開": {"on": ["カイ"], "kun": ["ひら.く", "あ.く"], "meanings": ["open"], "meanings_ko": ["열다"], "strokes": 12, "jlpt": 4},
    "閉": {"on": ["ヘイ"], "kun": ["し.める", "と.じる"], "meanings": ["close", "shut"], "meanings_ko": ["닫다"], "strokes": 11, "jlpt": 4},
    "走": {"on": ["ソウ"], "kun": ["はし.る"], "meanings": ["run"], "meanings_ko": ["달리다"], "strokes": 7, "jlpt": 4},
    "歩": {"on": ["ホ", "ブ", "フ"], "kun": ["ある.く", "あゆ.む"], "meanings": ["walk"], "meanings_ko": ["걷다"], "strokes": 8, "jlpt": 4},
    "止": {"on": ["シ"], "kun": ["と.まる", "と.める"], "meanings": ["stop"], "meanings_ko": ["멈추다"], "strokes": 4, "jlpt": 4},
    "送": {"on": ["ソウ"], "kun": ["おく.る"], "meanings": ["send"], "meanings_ko": ["보내다"], "strokes": 9, "jlpt": 4},
    "届": {"on": ["カイ"], "kun": ["とど.く", "とど.ける"], "meanings": ["deliver", "reach"], "meanings_ko": ["닿다", "전하다"], "strokes": 8, "jlpt": 4},
    "届": {"on": ["カイ"], "kun": ["とど.く", "とど.ける"], "meanings": ["deliver", "reach"], "meanings_ko": ["닿다", "전하다"], "strokes": 8, "jlpt": 4},
    "届": {"on": ["カイ"], "kun": ["とど.く", "とど.ける"], "meanings": ["deliver", "reach"], "meanings_ko": ["닿다", "전하다"], "strokes": 8, "jlpt": 4},
    "届": {"on": ["カイ"], "kun": ["とど.く", "とど.ける"], "meanings": ["deliver", "reach"], "meanings_ko": ["닿다", "전하다"], "strokes": 8, "jlpt": 4},
    "届": {"on": ["カイ"], "kun": ["とど.く", "とど.ける"], "meanings": ["deliver", "reach"], "meanings_ko": ["닿다", "전하다"], "strokes": 8, "jlpt": 4},
    "届": {"on": ["カイ"], "kun": ["とど.く", "とど.ける"], "meanings": ["deliver", "reach"], "meanings_ko": ["닿다", "전하다"], "strokes": 8, "jlpt": 4},
    "届": {"on": ["カイ"], "kun": ["とど.く", "とど.ける"], "meanings": ["deliver", "reach"], "meanings_ko": ["닿다", "전하다"], "strokes": 8, "jlpt": 4},
    "届": {"on": ["カイ"], "kun": ["とど.く", "とど.ける"], "meanings": ["deliver", "reach"], "meanings_ko": ["닿다", "전하다"], "strokes": 8, "jlpt": 4},
}


def is_kanji(char: str) -> bool:
    """Check if a character is a kanji.

    Uses Unicode ranges for CJK Unified Ideographs.
    """
    if len(char) != 1:
        return False

    code = ord(char)
    # CJK Unified Ideographs (most common kanji)
    if 0x4E00 <= code <= 0x9FFF:
        return True
    # CJK Unified Ideographs Extension A
    if 0x3400 <= code <= 0x4DBF:
        return True
    # CJK Unified Ideographs Extension B
    if 0x20000 <= code <= 0x2A6DF:
        return True
    return False


def extract_kanji_from_text(text: str) -> list[str]:
    """Extract unique kanji characters from text.

    Args:
        text: Japanese text to extract kanji from

    Returns:
        List of unique kanji characters in order of appearance
    """
    seen = set()
    result = []
    for char in text:
        if is_kanji(char) and char not in seen:
            seen.add(char)
            result.append(char)
    return result


def get_kanji_info(character: str) -> Optional[dict]:
    """Get information about a kanji character.

    Args:
        character: A single kanji character

    Returns:
        Dictionary with kanji information or None if not found
    """
    if not is_kanji(character):
        return None

    info = KANJI_DICT.get(character)
    if info:
        return {
            "character": character,
            "on_readings": info.get("on", []),
            "kun_readings": info.get("kun", []),
            "meanings": info.get("meanings", []),
            "meanings_ko": info.get("meanings_ko", []),
            "stroke_count": info.get("strokes"),
            "jlpt_level": info.get("jlpt"),
        }

    # Return basic info for unknown kanji
    return {
        "character": character,
        "on_readings": [],
        "kun_readings": [],
        "meanings": [],
        "meanings_ko": [],
        "stroke_count": None,
        "jlpt_level": None,
    }


def analyze_kanji_in_word(word: str) -> list[dict]:
    """Analyze all kanji in a word.

    Args:
        word: Japanese word to analyze

    Returns:
        List of kanji information dictionaries
    """
    kanji_chars = extract_kanji_from_text(word)
    return [get_kanji_info(char) for char in kanji_chars if get_kanji_info(char)]
