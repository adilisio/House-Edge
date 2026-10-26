// House Edge, act two: three days to the gala.
//
// Same conventions as act1.ink. Act one's flags are copied in by the player
// before the story starts; the defaults below stand in when there's no save.
//
// Each day opens with one of Crane's moves (no slot), then the player spends
// that day's slots: two on days one and two, three on day three. Each crew
// secret takes a clue scene and a response scene; scouting scenes compete for
// the same slots. Leo's office scene is fixed on the evening of day one.

// From act one.
VAR leaked = "vault"
VAR theo_rescue = "bluff"
VAR leo_open = false
VAR dee_wary = false
VAR vince_helped = false

// Act two.
VAR day = 1
VAR slot = 0            // slots used today
VAR slots_used = 0
VAR theo_resp = ""      // "confront", "help" or "quiet"
VAR vince_resp = ""
VAR dee_resp = ""
VAR scout_poker = false
VAR scout_cameras = false
VAR scout_vault = false
VAR scout_getaway = false

// Heist night's three checks, set at the end of the act.
VAR theo_safe = false
VAR vince_handled = false
VAR dee_won = false

-> day_one

=== function slots_today() ===
{ day == 3:
    ~ return 3
}
~ return 2

=== function time_of_day() ===
{
    - slot == 0:
        ~ return "morning"
    - day == 3 and slot == 1:
        ~ return "afternoon"
    - else:
        ~ return "evening"
}

=== function day_name() ===
{ day:
    - 1: ~ return "Day one"
    - 2: ~ return "Day two"
    - else: ~ return "Day three"
}

// ---- The days -----------------------------------------------------------

=== day_one ===
~ day = 1
~ slot = 0
Day one # card
The crew's hideout is a rented garage on Pier Street with a coffee machine and a whiteboard. # panel: hideout # cast: Sam, Leo, Vince, Dee, Theo
LEO: Bad news. Security doubled overnight. Four guards on the doors where there were two. # mood: Leo worried
VINCE: Overnight. The night after we all met. Somebody talked. # mood: Vince angry
He doesn't look at anyone. Then he looks at Dee.
DEE: Careful. # mood: Dee angry
Everyone turns to you.
* [“Then we adjust.”]
    SAM: Then we adjust. Four guards is just two more people to plan around.
* [“Let him double it.”]
    SAM: Let him double it. Every extra guard is overtime he's paying for nothing.
- Theo laughs, a little too loud. The room breathes again. # mood: Theo happy, Vince neutral, Dee neutral, Leo neutral
-> plan

=== day_two ===
~ day = 2
~ slot = 0
Day two # card
Leo comes in late and drops onto a crate. # panel: hideout # cast: Sam, Leo, Theo
LEO: Crane moved me. No more blackjack. I'm in the cashier's cage now, counting chips behind glass. # mood: Leo sad
THEO: He knows. He knows about us. He knows everything, doesn't he? # mood: Theo worried
On the table, among the blueprints, a business card sits under your coffee cup.
* [“If he knew everything, we'd be in jail.”]
    SAM: If he knew everything, we'd be in jail. He's guessing. Let him guess.
* [“The cage is better. You'll see the gala money come in.”]
    SAM: The cage is better. From there, you'll see every chip that comes in on gala night.
- Leo thinks about it, then nods slowly. # mood: Leo neutral, Theo neutral
-> plan

=== day_three ===
~ day = 3
~ slot = 0
Day three # card
{ leaked:
    - "date":
        The papers are full of it: Crane has hired forty extra staff for gala night. # panel: hideout # cast: Sam, Leo, Vince, Dee, Theo
        VINCE: Forty. On the one night we picked. That's not luck. # mood: Vince angry
    - "vault":
        Leo has it from the cage: Crane had a new combination fitted to the vault this morning. # panel: hideout # cast: Sam, Leo, Vince, Dee, Theo
        LEO: New dial, new numbers. Whatever we knew about that lock is worthless now. # mood: Leo worried
    - else:
        Theo comes in shaking. Two of Crane's men paid his brother a visit last night. Just to talk. # panel: hideout # cast: Sam, Leo, Vince, Dee, Theo # mood: Theo worried
        THEO: They knew his name. They knew where he lives. # mood: Theo sad
}
The crew argues. You pour another coffee.
LEO: You're taking this awfully well. # mood: Leo worried
* [“Panicking won't open the vault.”]
    SAM: Panicking won't open the vault.
* [“Crane wants us rattled. Don't give him that.”]
    SAM: Crane wants us rattled. Don't give him that.
- Leo looks at you a moment longer than he needs to. Then he lets it go. # mood: Leo neutral
-> plan

// ---- Spending the day's slots ------------------------------------------

=== plan ===
{ slot >= slots_today(): -> end_of_day }
{day_name()}, {time_of_day()}. Where do you spend it? {7 - slots_used} of 7 chances left. # panel: city-map # cast: Sam
+ {not theo_clue} [Check on Theo] -> theo_clue
+ {theo_clue and theo_resp == ""} [Deal with Theo's debt] -> theo_response
+ {not vince_clue} [Have a drink with Vince] -> vince_clue
+ {vince_clue and vince_resp == ""} [Deal with Vince's passports] -> vince_response
+ {not dee_clue} [Go over the route with Dee] -> dee_clue
+ {dee_clue and dee_resp == ""} [Find out who Dee really is] -> dee_response
+ {not scout_poker} [Scout: watch the high roller play] -> scout_poker_scene
+ {not scout_cameras} [Scout: test a camera loop with Theo] -> scout_cameras_scene
+ {not scout_vault} [Scout: get a look at the vault door] -> scout_vault_scene
+ {not scout_getaway} [Scout: drive the getaway route] -> scout_getaway_scene

=== spent ===
~ slot++
~ slots_used++
-> plan

=== end_of_day ===
{ day:
    - 1: -> leo_office
    - 2: -> day_three
    - else: -> heist_eve
}

// ---- Leo (fixed, evening of day one) -----------------------------------

=== leo_office ===
That night, you wait in the staff corridor while Leo drops the day's table counts at Crane's office. # panel: office-hall # cast: Sam
He's inside for a minute. Through the gap in the door you see him straighten a picture frame on Crane's wall. # cast: Sam, Leo
When he comes out, he hands you an old photo instead of a greeting. Two men by a roulette wheel, arms round each other.
LEO: My dad. And Crane, before he was Crane. Thirty years ago, they were partners too. # mood: Leo sad
{ leo_open: He doesn't finish the story. After what you said at his table, he doesn't need to. | He doesn't say how that ended. You can guess. }
-> day_two

// ---- Theo ---------------------------------------------------------------

=== theo_clue ===
Theo's at the hideout laptop with his headphones off, on the phone. He doesn't hear you come in. # panel: hideout # cast: Theo
THEO: I know. I KNOW, okay? Forty thousand. I'm getting it. # mood: Theo angry
THEO: No. Don't go back there. Don't go near the Gilded Crane. I'll fix it. # mood: Theo worried
He hangs up, sees you, and goes white. # cast: Sam, Theo # mood: Theo shocked
THEO: How long have you been there?
SAM: Long enough. Your brother owes Crane money.
THEO: It's not your problem. # mood: Theo angry
It is now. A kid who owes Crane is a kid Crane can lean on.
-> spent

=== theo_response ===
You find Theo on the hideout roof, staring at the casino lights. # panel: rooftop # cast: Sam, Theo
* [Confront him about the debt]
    ~ theo_resp = "confront"
    SAM: You should have told me. If Crane finds out you're with us, your brother's debt is a leash.
    THEO: Then I'll pay it! I'll go tonight and sort it out myself! # mood: Theo angry
    He's down the fire escape before you can stop him. He'll be back. But he's gone straight to his brother, and anyone watching his brother will see him come. # mood: Sam sad
* [Help him: pay the debt]
    ~ theo_resp = "help"
    You put an envelope on the ledge beside him. Most of your own stake.
    THEO: What's this? # mood: Theo shocked
    SAM: Forty thousand. Pay it off in your brother's name. Then Crane has nothing to hold over you.
    THEO: ...Why would you do that? # mood: Theo sad
    SAM: {theo_rescue == "bluff": Same reason I said I was your parole officer. | Same reason I pulled that fire alarm.} You're worth it. # mood: Sam happy
* [Keep quiet and use it]
    ~ theo_resp = "quiet"
    SAM: Your brother's debt stays between us. As long as you do exactly what I say on gala night.
    THEO: That's... yeah. Okay. Whatever you say. # mood: Theo sad
    He won't look at you after that. Somewhere, Crane is learning the same lesson you just did: the kid has a lever.
- -> spent

// ---- Vince --------------------------------------------------------------

=== vince_clue ===
Vince buys the drinks, tells three stories you've heard before, and goes to the bathroom. # panel: bar # cast: Sam, Vince
His bag is open on the stool. Inside, tucked in a sock, are two passports. Fake, and good. # cast: Sam # mood: Sam shocked
One is Vince's. The other is a woman you've never seen. Neither is yours.
When he comes back, you're halfway through your drink and smiling. # cast: Sam, Vince # mood: Sam happy
VINCE: What?
SAM: Nothing. Just like old times.
-> spent

=== vince_response ===
You meet Vince at the gallery, after hours. # panel: gallery # cast: Sam, Vince
* [Confront him about the passports]
    ~ vince_resp = "confront"
    SAM: Two passports, Vince. Neither of them mine. # mood: Sam angry
    VINCE: Those? Old stock. A favour for a friend. You know me. # mood: Vince happy
    He laughs it off. You do know him. That's the problem.
* [Help him: offer a bigger cut]
    ~ vince_resp = "help"
    SAM: I've been thinking. You're taking the biggest risk at that poker table. Your share should be bigger.
    VINCE: Old friend. That's generous. # mood: Vince happy
    He shakes your hand. It's a warm handshake. It doesn't change anything in his bag.
* [Keep quiet and plan around him]
    ~ vince_resp = "quiet"
    You say nothing about the passports. You talk about the plaques, the side table, the counterfeits.
    And on the way out, you make a phone call Vince doesn't hear, about where the money goes once he's lifted it. # cast: Sam # mood: Sam happy
    {vince_helped: He thinks he's still the best con artist in the room. Let him. | He thinks you're the same mark you always were. Let him.}
- -> spent

// ---- Dee ----------------------------------------------------------------

=== dee_clue ===
You walk Dee through the getaway route in her car, parked across from the casino. # panel: dee-car # cast: Sam, Dee
DEE: And Theo loops the east corridor camera at ten past, so we come out the side door at twelve past.
You never told her about the east corridor. Only Theo and you know which camera gets looped. # mood: Sam shocked
SAM: Who told you about the east corridor?
DEE: You did. Yesterday.
{ dee_wary: She says it a beat too fast, the way she said she takes corners like someone who doesn't want to meet a cop. | She says it easily. Too easily. }
-> spent

=== dee_response ===
You find Dee at the diner on Fifth, the same stool, the same black coffee. # panel: diner # cast: Sam, Dee
* [Confront her with the truth about Crane]
    ~ dee_resp = "confront"
    SAM: You're a cop. It's fine. I know who you're really after, and it isn't me.
    SAM: Crane framed me five years ago, and he had help. A detective named Kessler.
    Dee sets the cup down very carefully. # mood: Dee shocked
    DEE: Say that name again. # mood: Dee angry
    SAM: Kessler. Get me into that office on gala night, and you'll hear Crane say it himself.
* [Help her case without saying a word]
    ~ dee_resp = "help"
    You leave a folder on the stool beside her and walk out without a word: copies of Kessler's old case notes on you, with every gap circled.
    The next morning, she's at the hideout early. She doesn't mention the folder. She does bring you a coffee. # mood: Dee happy
* [Use her cover to feed the police false information]
    ~ dee_resp = "quiet"
    You let slip, very carefully, that the job is on the wrong night, through the wrong door.
    She writes nothing down. She doesn't need to. By tomorrow, it'll be in a police report.
    And when it turns out to be wrong, someone at the station will want to know where she got it.
- -> spent

// ---- Scouting -----------------------------------------------------------

=== scout_poker_scene ===
~ scout_poker = true
You spend a few hours at the high-limit room's rail, watching the high roller lose politely. # panel: high-limit # cast: Sam, High Roller
Every time he gets bored, he twists the ring on his little finger. Then his eyes wander. # cast: High Roller # mood: High Roller sad
Now you know what boredom looks like on him. On gala night, you'll see it coming.
-> spent

=== scout_cameras_scene ===
~ scout_cameras = true
Theo sneaks you into a service corridor with a laptop and a cable he insists is legal. # panel: corridor # cast: Sam, Theo
THEO: Watch the fan on the live feed. See how it drifts against the recording? You wait till they line up.
You practise until you can feel it coming. Theo's impressed. You can tell, because he stops explaining. # mood: Theo happy
-> spent

=== scout_vault_scene ===
~ scout_vault = true
Leo gets you as far as the vault floor's service door, five minutes before a shift change. # panel: vault-floor # cast: Sam, Leo
Through the gap you see it: { leaked == "vault" and day == 3: Crane's new dial, still shiny. | a Harlow dial, the old kind. } The tumblers click loud enough to hear if the room is quiet.
LEO: It won't be quiet on gala night. # mood: Leo worried
SAM: It will be for me. # mood: Sam happy
-> spent

=== scout_getaway_scene ===
~ scout_getaway = true
Dee drives you round the casino blocks three times, slow, like tourists. # panel: dee-car # cast: Sam, Dee
DEE: Patrol cars sit on Fifth and on the waterfront. If they put up roadblocks, it'll be on the straight run to the garage.
You learn the streets until you can see them with your eyes shut.
-> spent

// ---- The night before ---------------------------------------------------

=== heist_eve ===
~ theo_safe = theo_resp == "help"
~ vince_handled = vince_resp == "quiet"
~ dee_won = dee_resp == "confront" or dee_resp == "help"
The night before the gala, the crew sits in the garage with the lights off and the whiteboard wiped clean. # panel: hideout # cast: Sam, Leo, Vince, Dee, Theo
Nobody says much. Everyone is keeping something back. You most of all.
{ theo_safe: Theo checks his phone, sees no messages from his brother, and for once looks his age. # mood: Theo happy | Theo checks his phone every two minutes. # mood: Theo worried }
{ vince_handled: Vince is telling a story, and you're the only one who knows it's not the story he thinks it is. # mood: Vince happy | Vince is telling a story. He's very relaxed for a man about to rob a casino. # mood: Vince happy }
{ dee_won: Dee catches your eye across the room and gives you the smallest nod. # mood: Dee happy | Dee sits by the door, closest to the exit, watching all of you. # mood: Dee worried }
SAM: Tomorrow night, Crane throws a party. Let's give him something to remember. # mood: Sam happy
Heist night # card
-> END
