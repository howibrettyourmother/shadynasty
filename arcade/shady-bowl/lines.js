// SHADY BOWL: team flavor + roast commentary. Digs are about fantasy football, teams and hobbies only.
const BRETT='603082868373135360';
const TEAMS=[
 {id:'603082868373135360',team:'Wilson Weasels',mgr:'Brett',ab:'WEA',c:['#2a2f3a','#e3262e','#6b7280'],em:['👎','🍅','💨'],txt:'BOOOO',w:6,av:'c1e257fa885107a2cea04b70f1c9335c',heel:1},
 {id:'679000405232934912',team:'Rebuilding Morehouse’s',mgr:'Joe',ab:'MOR',c:['#ff4fd8','#ffd23f','#3fd8ff'],em:['🌈','✨','🦄','🚧'],txt:'UNDER CONSTRUCTION',w:0,av:'4f4090e5e9c3941414db40a871e3e909',wip:1},
 {id:'602659459214409728',team:'Bigmike9193',mgr:'Big Mike',ab:'BIG',c:['#b22234','#ffffff','#3c3b6e'],em:['🇺🇸','⭐','✈️'],txt:'FREEDOM',w:3,av:'d55d1f7075eda01948318de4af616075'},
 {id:'679012011916492800',team:'Badfish',mgr:'Justin',ab:'BAD',c:['#c8642a','#e8b04b','#7a4a22'],em:['🤠','🌵','🥵'],txt:'YEEHAW (UGH)',w:5,av:'04c43e60f53425972355da7967f58ebb'},
 {id:'602988793519214592',team:'TheTunaSquad',mgr:'Jay',ab:'TUN',c:['#1e90ff','#7fd3ff','#0b4f8a'],em:['🐟','🐟','🌊'],txt:'BIG TUNA',w:1,av:'93bf4ccf4ee12f405f5617b95b001ab4'},
 {id:'679423513769111552',team:'Ramrod',mgr:'Aron',ab:'RAM',c:['#e3262e','#2b6cff','#ffffff'],em:['👮','🥤','🚨'],txt:'CAR RAMROD',w:5,av:'b3338675f635c2c1f42b469621d38ec6'},
 {id:'679424354223738880',team:'Still Renovating',mgr:'El Jefe',ab:'JEF',c:['#ffc72c','#fff3b0','#d4a017'],em:['👒','✨','🔨'],txt:'PRILLIONAIRE',w:4,av:'73d5ec73486fef34844dff3ffa291d29'},
 {id:'679424003198238720',team:'A new dawn rising',mgr:'David',ab:'BAM',c:['#9e1b32','#ffffff','#828a8f'],em:['🐘','🐘','🏈'],txt:'ROLL TIDE',w:1,av:'b1a63cf49df97c4d97727a13823b4281'},
 {id:'679425819310903296',team:'Excessive Celebration',mgr:'Adam',ab:'EXC',c:['#2d6cdf','#ffffff','#fdb913'],em:['🏔️','❄️','🤜','🤛'],txt:'SEND IT',w:4,av:'3b55a73b1ca6ca0e0b5dfaec192d78a0'},
 {id:'679818637024010240',team:'DetroitDumpsterFire',mgr:'Johnny',ab:'DDF',c:['#ff6a00','#ffb300','#2d2d2d'],em:['🔥','🗑️','🎸'],txt:'RECALL ISSUED',w:0,av:'7357626f583a6b2757cb9fbf9e8cf63e'},
 {id:'684465506765316096',team:'SaquonMyPickens',mgr:'Jay',ab:'SMP',c:['#ffcb05','#00274c','#bfe8ff'],em:['🫧','🧽','🩼'],txt:'GO BLUE',w:4,av:'b3338675f635c2c1f42b469621d38ec6'},
 {id:'559056589221363712',team:'Tet McMuffins',mgr:'Danny',ab:'TET',c:['#1f4e9c','#ffffff','#e3262e'],em:['✈️','🧳','☁️'],txt:'THE BEST MOREHOUSE',w:3,av:'3ff34004f13a823510bc520d4f0c1c99'}
];
// per-team lines. td: you scored as this team. fail: this team screwed up on offense.
// opp: this team scored ON you. vs: this team got stuffed by you. intro: kickoff line.
const FLAVOR={
'603082868373135360':{
 td:["Weasels score. Throw your beer at the screen, it won't help.","Touchdown Weasels. The crowd boos so loud the scoreboard rattles.","Brett celebrates by updating the website about it. Again.","Touchdown. The weasel tips the eat-shit hat to the booing section."],
 fail:["The weasel coughs it up and 50,000 people cheer. Best moment of their lives.","Even the weasel gets humbled. Screenshot it, nobody will believe you.","Brett's offense stalls. He's already typing the excuse post."],
 opp:["The weasel scores on you and blows a kiss to the booing section.","Weasels score. His walk-up music hits. Everybody hates it."],
 vs:["You stuffed the Weasels. Somewhere, a league chat explodes with joy.","Weasels go three-and-out. The crowd chants something not printable."],
 intro:"The weasel enters the arena in the eat-shit hat to a chorus of boos. He loves it."},
'679000405232934912':{
 td:["Touchdown Morehouse’s! Quick, trade the scorer for a 2029 4th before he gets good.","A TD for the rebuild! Glitter cannons fire. Year 5 is gonna be the year, baby!","Joe scores and immediately asks if the touchdown is 'a long-term asset'.","Rainbows! Glitter! Six points that Joe will still somehow sell for picks."],
 fail:["Pardon the dust, this offense is under construction. Forever.","Joe calls it a 'development drive'. Everyone else calls it a punt.","Another rebuilding drive. Projected completion date: never.","That drive was traded for a future 3rd round pick. Nobody asked."],
 opp:["The rebuild scored on you. That's like getting dunked on by a construction cone.","Morehouse’s TD! Glitter everywhere. You'll be finding it for weeks."],
 vs:["Rebuild stuffed. Joe nods: 'Building through the draft.'","Morehouse’s punt. The hard hats in the stands don't even look up."],
 intro:"Kickoff! Morehouse’s rolls out under a 'PARDON OUR DUST' banner. Year 5 of the rebuild."},
'602659459214409728':{
 td:["TOUCHDOWN AMERICA! Jets flyover! An eagle cries a single tear!","Big Mike scores and the stadium spontaneously plays the anthem.","Red, white and SIX POINTS. Freedom just went deep."],
 fail:["Big Mike's drive stalls. The flag stays up, the offense stays down.","Red, white and blew it.","Fireworks were scheduled. Duds were delivered."],
 opp:["Big Mike scores on you. Fighter jets buzz your sideline personally.","Freedom just ran it in your face."],
 vs:["Big Mike's offense salutes and walks off the field.","Stopped! Big Mike blames foreign interference."],
 intro:"Fighter jets scream over the stadium. Big Mike salutes. The offense does not."},
'679012011916492800':{
 td:["Touchdown Badfish! A reluctant 'yeehaw' escapes Justin's mouth. He hates himself.","Six points! Justin celebrates by cranking the AC to 58 and staring at a cactus.","Everything's bigger in Texas, including this lead. Justin is still miserable."],
 fail:["Badfish stalls out. Hot as hell outside, cold as hell in the red zone.","Tumbleweed rolls through the backfield. That was the run game.","Yeehaw (derogatory)."],
 opp:["Badfish scores. Justin mutters 'yeehaw' like it's a hostage statement.","It's 104 degrees and Badfish just scorched you."],
 vs:["Badfish stuffed! Justin blames the humidity. And Texas. Mostly Texas.","Three-and-out. Somewhere a Texan sighs and turns the AC up."],
 intro:"Badfish takes the field. Justin, from Texas, against his will: 'yeehaw I guess.'"},
'602988793519214592':{
 td:["BIG TUNA scores! Fresh catch, served raw!","Touchdown! The Tuna Squad swims upstream for six.","That ball was hooked, gutted and canned in the end zone."],
 fail:["Canned again.","Something smells fishy. It's that drive.","Tuna Squad, swimming with the bottom feeders."],
 opp:["The Tuna Squad scores. You got filleted.","Big Tuna reels you in for six."],
 vs:["Tuna stuffed. Dolphin-safe, win-safe.","Caught, gutted, punted."],
 intro:"Big Tuna takes the field. Smells like low tide and confidence."},
'679423513769111552':{
 td:["CAR RAMROD! ...Car Ramrod. Touchdown!","Touchdown! Farva orders a liter of cola to celebrate.","Meow. Meow, I said that was a touchdown. Meow."],
 fail:["License and registration... and a reason you called that play.","Farva would've done better. And Farva sucks.","Desperation. Pull it over, son."],
 opp:["Ramrod scores. You're doing 60 in a 140 zone and you just got lit up.","Car Ramrod! You've been ticketed for six."],
 vs:["Ramrod pulled over. No touchdown for you, Farva.","Stopped! Somebody throw Farva a burrito, he's crying."],
 intro:"Sirens! Ramrod rolls in. Somebody yells 'CAR RAMROD'. Nobody knows why."},
'679424354223738880':{
 td:["Prilling spree! Touchdown El Jefe!","Prillionaire status: six more points in the bank.","Prillbo Baggins: there and back again, and into the end zone!","Unprillievable! El Jefe scores!"],
 fail:["Prill or be prilled. That was getting prilled.","El Jefe has spoken. The offense did not listen.","Still Renovating. The offense too."],
 opp:["El Jefe scores. Prill or be prilled, and you just got prilled.","Prilling spree on your defense."],
 vs:["Unprillievable stop!","Prillin' and chillin'... on the sideline after a punt."],
 intro:"El Jefe strides out, hat tipped. A Prilling spree is forecast."},
'679424003198238720':{
 td:["ROLL TIDE! Touchdown! Rammer Jammer!","Six! David screams 'ROLL TIDE' at a referee who did not ask.","The Process: score touchdown, mention Alabama, repeat."],
 fail:["Roll Tide... roll right out of field goal range.","Saban would've cut that whole drive by Tuesday.","The elephant in the room: this offense."],
 opp:["Alabama-style. Roll Tide, roll right over you.","They score. Somebody in a houndstooth hat is screaming."],
 vs:["Stuffed! Rammer jammer, yellow hammer, give 'em... a punt.","Three-and-out. The Tide went out."],
 intro:"A new dawn rises. Houndstooth everywhere. ROLL TIDE, whether you asked or not."},
'679425819310903296':{
 td:["SEND IT! Touchdown, bro! Fist bumps all around!","Mile High touchdown! Adam does a celebration so excessive it gets flagged.","Bro scores at altitude and needs oxygen afterwards."],
 fail:["Bro, you peaked in Week 1.","Mile high lineup, sea-level drive.","Sent it... straight into the Toilet Bowl."],
 opp:["Excessive Celebration scores and celebrates for nine straight minutes.","Bro just sent it right through your secondary."],
 vs:["Stuffed, bro. Zero fist bumps.","Altitude sickness hits the offense."],
 intro:"Adam rolls in from Denver with fresh powder on his boots. SEND IT."},
'679818637024010240':{
 td:["Touchdown Dumpster Fire! Johnny celebrates with an acoustic cover nobody requested.","Six points! GM issues a recall notice for that defense.","The Dumpster Fire is LIT. In a good way. For once."],
 fail:["Recall notice issued for this drive.","Check engine light's been on since Week 1.","Strumming the same sad song every drive."],
 opp:["Dumpster Fire scores. Johnny busts out the acoustic. You suffer twice.","Recall notice issued for YOUR defense."],
 vs:["Stuffed. Assembly line keeps rolling, so do the punts.","Unplugged: that drive."],
 intro:"Johnny tunes his acoustic. The dumpster smolders. Recall notices are on standby."},
'684465506765316096':{
 td:["Touchdown! Crystal clear, streak-free six! GO BLUE!","Jay squeegees the end zone and spikes the ball. Hail to the victors!","Six! And for once nobody on this team got carted off."],
 fail:["Wiped out. Like Week 6, when the whole starting lineup was in a walking boot.","Injury report: everyone. Again.","Go Blue (in the face)."],
 opp:["SaquonMyPickens scores. Somehow, with half the roster in the medical tent.","Squeaky clean touchdown. Your defense got wiped."],
 vs:["Stuffed! The trainer's tent waves hello.","Another one limping off. Jay checks the injury report out of habit."],
 intro:"SaquonMyPickens arrives, with squeegees, Michigan maize and a trainer's tent pre-pitched."},
'559056589221363712':{
 td:["Touchdown! This is your captain speaking: we have arrived at the end zone.","747 lands for six! The Best Morehouse, low bar, cleared.","Smooth landing! Please remain seated while the opponent cries."],
 fail:["Turbulence in the backfield. Please return to your seats.","Your drive has been delayed. Please check the departures board.","In case of a water landing, this offense is not a flotation device."],
 opp:["Tet McMuffins scores. The Best Morehouse lands it on your forehead.","747 touchdown. You've been put in the overhead bin."],
 vs:["Grounded! Flight cancelled.","Stuffed. The captain has turned on the 'fasten seatbelt' sign."],
 intro:"Captain Danny on the PA: 'Welcome aboard, from The Best Morehouse.' Cruising altitude: smug."}
};
const GEN={
 td:["TOUCHDOWN {T}! {QB} goes deep and actually finishes for once.","Six! {WR} scores and does a dance that should be illegal in several states.","Touchdown! {O}'s secondary just got embarrassed on national TV.","{QB} to {WR}! That defense got pantsed!"],
 runTd:["{RB} takes it to the house! The defense grabbed nothing but air and regret.","{RB} breaks it! Juked out of his damn shoes!"],
 catch:["{QB} hits {WR} for {Y}.","{WR} snags it. {Y} yards, baby.","Dime from {QB}. {WR} for {Y}."],
 run:["{RB} pounds it for {Y}.","{RB} slips through for {Y}.","{RB} grinds out {Y}."],
 loss:["{RB} gets swallowed whole. Loss of {Y}.","Stuffed in the backfield. Brutal."],
 inc:["Incomplete. {QB} threw that one to his imaginary friend.","Dropped! {WR} has hands like a waiver-wire kicker.","Incomplete. Ball hits the turf, the crowd groans."],
 pick:["INTERCEPTED! {QB} just threw his fantasy owner under the bus.","PICKED OFF! That pass was a gift. Wrapped. With a bow.","Pick! {QB} saw the defender and threw it to him anyway."],
 sack:["SACKED! {QB} gets folded like a lawn chair.","Sack! {QB} held it longer than Joe holds a rebuild.","Down goes {QB}! Somebody check if he's still in the league."],
 fumble:["FUMBLE! Butterfingers! Ball's out!"],
 juke:["JUKE!","ANKLES!","SHAKE 'N BAKE!","SEE YA!"],
 first:["First down!","Move the sticks!"],
 fg:["It's GOOD!","Field goal is good. Kicker earns his roster spot for one more week."],
 fgMiss:["NO GOOD! Kicker should be on waivers by morning.","Wide! That was uglier than a 0.3-point projection."],
 punt:["Punt. Boring, but legal.","Punting. The crowd boos like it's Brett walking in."],
 downs:["Turnover on downs. Should've punted, coach.","Stuffed on 4th. Bold strategy, didn't work."],
 safety:["SAFETY! Tackled in your own end zone. Embarrassing."],
 win:["{T} wins! Go talk your shit in the group chat.","Victory! {O} goes home and hits the waiver wire to cope."],
 lose:["{O} wins. Delete the app. Reinstall it. Try again.","You lost to {O}. That's going in the Hall of Shame."]
};
// ---------- v2: R-rated booth. Fantasy failures only: trades, benching, choking, waivers. ----------
Object.assign(GEN,{
 td:["TOUCHDOWN {T}! {QB} finally throws a ball worth a shit!","Six fucking points! {WR} just made {O}'s secondary look like waiver-wire trash.","Touchdown! {O}'s defense got their asses handed to them.","{QB} to {WR}! Holy shit, somebody on this team actually showed up!","TOUCHDOWN! {O} is gonna be crying in the group chat about this one."],
 runTd:["{RB} takes it to the fucking house! Nobody laid a finger on him!","{RB} breaks it! Juked those dumbasses right out of their cleats!","{RB} walks in untouched. That defense couldn't tackle a fucking practice dummy."],
 catch:["{QB} hits {WR} for {Y}. Not bad, not bad at all.","{WR} snags it for {Y}. Strong-ass hands.","Dime from {QB}! {WR} for {Y}, move your ass!"],
 run:["{RB} pounds it for {Y}.","{RB} slips through for {Y}. Good shit.","{RB} grinds out {Y}. Ugly as hell, but it counts."],
 loss:["{RB} gets eaten alive. Loss of {Y}. Jesus Christ.","Stuffed in the backfield. That's some bullshit blocking."],
 inc:["Incomplete. {QB} threw that shit to nobody.","Dropped! {WR} has hands like a goddamn waiver-wire kicker.","Incomplete. That ball had no fucking business being thrown."],
 pick:["INTERCEPTED! {QB} just shit the bed on live TV!","PICKED OFF! What the fuck was that throw?!","Pick! {QB} looked right at the defender and threw it to him anyway. Bench his ass."],
 sack:["SACKED! {QB} gets folded like a cheap-ass lawn chair!","Sack! {QB} held it like a guy who won't accept a fair trade offer.","Down goes {QB}! That line blocked like a bunch of dead roster spots."],
 punt:["Punt. Gutless, but legal.","Punting. The crowd's already booing this chickenshit call."],
 downs:["Turnover on downs. Should've punted, dumbass.","Stuffed on 4th! Bold-ass strategy. Did not fucking work."],
 safety:["SAFETY! Tackled in your own end zone. Fucking embarrassing."],
 fgMiss:["NO GOOD! Cut that kicker before he shanks another one.","Wide as shit! Uglier than a 0.3-point projection."],
 win:["{T} wins! Go talk your shit in the group chat.","Victory! {O} goes home and rage-adds kickers off waivers.","{T} beat {O}'s ass. Put it on the scoreboard and leave it there."],
 lose:["{O} wins. Delete the fucking app.","You lost to {O}. Hall of Shame, baby. Front row.","{O} kicked your ass. Somebody check the trade block, this shit is broken."],
 kickoff:["Welcome to the Shady Bowl, where the trash talk is free and the defense is optional. Let's fucking go!","Kickoff! Two lineups, zero shame, and a whole lot of bad fucking decisions.","Here we go! Grab a drink, this is gonna be ugly as hell."],
 big:["BIG PLAY! Holy shit, look at that!","Look at that son of a gun go! That defense is fucked!","Chunk play! {O}'s defense is getting torched!"],
 stall:["Drive's dead. Three and fucking out, basically.","That drive stalled harder than a trade with a guy who never answers.","Stalled out. This offense has the urgency of an abandoned roster."],
 dsack:["SACK! You buried that bastard!","BLITZ GETS HOME! Quarterback just got planted in the fucking dirt!","Sacked! {O}'s QB is gonna feel that shit on Wednesday."],
 dint:["PICKED OFF! You jumped that route like it owed you money!","INTERCEPTION! {O} threw it right to you. What a dumbass decision!","Jumped it! That's a pick, and {O} is losing their goddamn mind."],
 dbig:["Burned! You guessed wrong and they shoved it right up the field.","Big gain for {O}. Your secondary got cooked like a bad trade.","Ooh, that blitz got punished. Wide-ass open."],
 dstop:["Stuffed! Nice fucking stop.","Broken up! Not today, motherfuckers.","Nothing there. Defense, baby!"],
 dtd:["{O} scores on you. That defense played like a team with three byes in the lineup.","Touchdown {O}. You got your ass kicked on that drive."],
 two:["Going for two! Big balls move!","Two-point try. Either genius or dumbass, no in between."],
 twoGood:["TWO POINT CONVERSION IS GOOD! Ballsy as hell!"],
 twoBad:["Two-point try fails. Should've kicked it, genius."],
 onGood:["ONSIDE RECOVERED! Holy shit, sneaky bastards!"],
 onBad:["Onside kick fails. {O} gets great field position and a free laugh."],
 drill:["Two minutes. You're down. Time to stop fucking around.","Comeback time! Don't choke like a week 14 playoff lineup."]
});

// Joe's team (Rebuilding Morehouse's): footwear gag + endless-rebuild roasts only.
const JOE_LINES={intro:["Year whatever of the rebuild. Rebuilding Morehouse's takes the field, in heels, still two fucking years away.","Ladies and gentlemen, the eternal rebuild. He traded the future for more future and still can't field a goddamn lineup.","Rainbow Warrior? More like Rebuild Warrior. Kickoff!"],
 td:["Touchdown Morehouse's! Holy shit, a rebuild scored! Somebody check the standings, this never fucking happens.","They scored! Pour one in the stiletto, boys, next year might actually be this year.","Six points for the rebuild! Don't get used to it, he'll trade this guy for a third-round pick by Tuesday."],
 trip:["FUMBLE! He tripped over his own goddamn heel! Ball's loose!","Down he goes! Ankle rolled in the stiletto, ball on the turf. Peak fucking rebuild.","Tripped on a heel and coughed it up. Even the shoes are tanking for a draft pick."],
 stall:["Drive's dead. That's the rebuild, baby: all picks, no fucking points.","Stalled again. Wait till next year. He's been saying that shit since the Obama administration... of fantasy football.","Another empty drive. He'll trade the whole offense for futures and call it a process."],
 score:["Morehouse's gets torched. Trading away every starter for picks has fucking consequences.","Scored on the rebuild. Next year, though. Always next fucking year."]};
// rivalry intros: {W}-{L} is the all-time record from the player's side
const RIVAL={own:["{T} owns {O}, {W} and {L} all-time. Rent-free, every fucking week.","{O} has won {L} out of all these. That's not a rivalry, that's a hostage situation."],
 owned:["{O} has your number. You're {W} and {L} against them. Today you shove it up their ass or eat it again.","{W} and {L} against these assholes. Nemesis energy. Do not fucking choke."],
 even:["Dead even at {W} and {L}. Somebody's getting bragging rights and somebody's getting roasted."]};
// literal strings the announcer reads that are not in GEN / FLAVOR (pre-rendered too)
const VO_EXTRA=["Rivalry game!","Final!","Final.","Overtime! Somebody finish this shit.","Announcer is on. Let us fucking go.","Blitz blows up the run!","Run squirts past the blitz.","Right read, late jump. Tackled after the catch.","They ran a slant route. You guessed wrong.","They ran an out route. You guessed wrong.","They ran a deep route. You guessed wrong.","They ran a run. You guessed wrong.","You recover!","Extra point good.","Time!","the QB","the RB","the slot","WR1","WR2"];
