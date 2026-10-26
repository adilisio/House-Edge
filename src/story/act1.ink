// House Edge, act one: the free demo.
//
// Conventions the player (src/story/player.ts) understands:
//   NAME: text        a speech bubble; any other line is a caption
//   # panel: <place>  switch the comic panel's location
//   # cast: A, B      who is in the panel
//   # card            show the line as a full-panel title card
//   # freeze          freeze-frame on this line
//   # minigame: <s>   after this line, play hands-on scene <s>; its outcome
//                     lands in the Ink variable <s>_result (act three)
//   # mood: A happy, B worried
//                     change faces: neutral, happy, angry, worried, shocked
//                     or sad. A face holds until it's changed again or the
//                     panel moves somewhere new.
//
// Flags set here carry into act two.

VAR recruited = 0
VAR cop_stop_done = false
VAR leaked = ""          // what Sam gave the crooked cop: "date", "vault" or "crew"
VAR theo_rescue = ""     // "bluff" or "alarm"
VAR leo_open = false     // Sam named Crane's crime to Leo's face
VAR dee_wary = false     // Sam needled Dee about driving like a cop
VAR vince_helped = false // Sam helped Vince finish the gallery con

-> opening

=== opening ===
Every alarm in the Gilded Crane goes off at once. # panel: casino-exterior # cast: Sam
A black sedan screeches up to the side door, tyres smoking. # cast: Sam, Dee
DEE: Get in. Now. # mood: Dee angry
You stop on the kerb and look up, past the neon, at the office window on the top floor. # cast: Sam
For a second, you're almost smiling. # freeze # mood: Sam happy
-> three_weeks

=== three_weeks ===
Three weeks earlier # card
The Gilded Crane hasn't changed. Same red carpet, same chandeliers, same promise that tonight is your night. # panel: casino-floor # cast: Sam
Five years ago, half of it was yours. Then Victor Crane moved the money, signed your name, and let you take the fall. # mood: Sam angry
Three years inside. Everything you owned, gone.
The proof that Crane did it is somewhere in this building. To get it, you'll need a crew. # mood: Sam neutral
-> hub

=== hub ===
{ recruited == 2 and not cop_stop_done: -> cop_stop }
{ recruited == 4: -> cliffhanger }
Who do you go after next? # panel: city-map # cast: Sam
+ {not theo} [The kid who counts cards] -> theo
+ {not leo} [The dealer at Crane's blackjack tables] -> leo
+ {not dee} [The driver everyone talks about] -> dee
+ {not vince} [Vince, an old friend] -> vince

=== theo ===
The Lucky Strike is everything the Gilded Crane isn't: sticky carpet, flat beer, and a blackjack table with a cigarette burn shaped like Florida. # panel: lucky-strike # cast: Theo
At the table sits a skinny kid in a hoodie, winning. Quietly. Too consistently.
Two security guards are already moving his way. # cast: Theo, Guard # mood: Theo worried, Guard angry
* [Pose as his parole officer]
    ~ theo_rescue = "bluff"
    SAM: Gentlemen. Theo here is on my caseload, and he's past his curfew. # cast: Sam, Theo, Guard
    The guards look at each other. Nobody wants the paperwork. They let you walk him out. # mood: Guard neutral, Theo shocked
* [Pull the fire alarm]
    ~ theo_rescue = "alarm"
    You reach the red handle by the bar. The sprinklers stay off, but everybody else goes. # cast: Sam, Theo, Guard
    In the stampede for the doors, you take the kid by the sleeve and keep walking. # mood: Theo shocked, Guard worried
- Outside, his hands are shaking. # panel: alley # cast: Sam, Theo # mood: Theo worried
THEO: Why'd you do that? You don't even know me.
SAM: I know you count cards like you're doing homework. That's a gift, and you're wasting it on places like this.
THEO: I need the money. That's all you need to know. # mood: Theo angry
SAM: Then come and make some real money. You owe me one. # mood: Sam happy
He looks back at the guards in the doorway, then at you.
THEO: ...Yeah. Okay. I owe you one. # mood: Theo happy
~ recruited++
-> hub

=== leo ===
You take a seat at the far blackjack table, where the dealer has the kind of face people tell secrets to. # panel: casino-floor # cast: Sam, Leo
LEO: Evening. Feeling lucky? # mood: Leo happy
He deals you seventeen against his six. You should stand. He taps the felt, so you hit.
A four. Twenty-one.
He pays you out, and under the chips is a folded napkin: "I know who you are." # mood: Sam shocked, Leo neutral
* [Pocket the note and leave]
    You tip him, stand, and walk away without looking back. At the bar, you count to sixty.
    When you turn round, he's watching you. He nods once, toward the staff exit.
* [Say, "Then you know what Crane did."]
    ~ leo_open = true
    SAM: Then you know what Crane did.
    His hands stop for half a second. Then he shuffles. # mood: Leo worried
    LEO: Staff exit. Twenty minutes.
- LEO: I've dealt at that table for eleven years. I was there the night they walked you out in cuffs. # panel: alley # cast: Sam, Leo # mood: Leo sad
SAM: And you're telling me because?
LEO: Because whatever you're planning, I want in. Crane owes me too. # mood: Leo angry
{ leo_open: He doesn't say what for. You don't push. Not yet. | He doesn't say what for, and you don't ask. }
~ recruited++
-> hub

=== dee ===
Everyone says the best driver in the city drinks her coffee at a diner on Fifth. You find out why from the diner's window. # panel: city-street # cast: Sam
A grey hatchback comes round the corner with three police cars behind it. It spins once, threads the gap between two buses, and is gone. # cast: Dee # mood: Dee happy
The police cars are not.
Four minutes later, the hatchback rolls into the diner lot, slow as a Sunday. # panel: diner # cast: Sam
The driver comes in, sits at the counter, and orders a coffee. Black. # cast: Sam, Dee
* [Compliment the driving]
    SAM: That was some driving.
    DEE: Don't know what you mean. I've been here all morning.
    SAM: Course you have.
    She almost smiles. # mood: Dee happy
* [Ask who taught her to drive like a cop]
    ~ dee_wary = true
    SAM: Who taught you to drive like that? You take corners like a police academy graduate.
    The cup stops halfway to her mouth. # mood: Dee shocked
    DEE: I take corners like someone who doesn't want to meet one. # mood: Dee angry
    She doesn't look at you again until you mention money.
- SAM: I need a driver for one night. The pay is good.
DEE: How good?
SAM: Good enough that you never have to outrun anyone again. # mood: Sam happy, Dee neutral
DEE: ...I'm listening.
~ recruited++
-> hub

=== vince ===
Vince hasn't changed. Still the best-dressed man in the room, and the room is an art gallery. # panel: gallery # cast: Sam, Vince
He's selling a painting to a nervous buyer. The painting is a fake. You know, because years ago you watched him age the canvas with tea. # cast: Sam, Vince, Buyer
BUYER: I'd want an expert to look at it first. # mood: Buyer worried
Vince catches your eye across the room and raises an eyebrow.
* [Play the art expert]
    ~ vince_helped = true
    SAM: Forgive me, I couldn't help overhearing. Is that the Varga?
    You talk about brushwork for three minutes. You know nothing about brushwork. The buyer writes a cheque. # mood: Buyer happy, Sam happy
    VINCE: You haven't lost it.
* [Let him finish on his own]
    You study the other paintings. Behind you, Vince talks the buyer round the long way.
    It takes him twenty minutes, but the buyer writes a cheque.
    VINCE: You could have helped, you know. # mood: Vince sad
- VINCE: So. Out of prison, back in town, and looking at me like you need something. # cast: Sam, Vince # mood: Vince neutral, Sam neutral
SAM: One job. Crane's casino.
He laughs, then sees you're serious. # mood: Vince shocked
VINCE: Crane. Of course it's Crane. What's in it for me?
SAM: Your share of whatever's in his vault.
VINCE: Then I'm in. For old times' sake. # mood: Vince happy
~ recruited++
-> hub

=== cop_stop ===
~ cop_stop_done = true
As you walk back to your motel, a car pulls up beside you. Unmarked. A man leans out with a badge. # panel: street-night # cast: Sam, Kessler
KESSLER: Sam Hale. Detective Ray Kessler. I worked your case, back in the day.
SAM: I remember.
KESSLER: Then you'll remember I don't like surprises. What brings an ex-con back to Crane's part of town? # mood: Kessler angry
// Every answer gives him something. That's the point.
* [Say you're here for the gala]
    ~ leaked = "date"
    SAM: The anniversary gala. Three weeks Saturday. Thought I'd see how the old place is doing.
* [Joke about Crane's vault]
    ~ leaked = "vault"
    SAM: Sightseeing. I hear Crane's private vault is the size of a parking garage. Thought I'd see it while I can.
* [Say you're catching up with friends]
    ~ leaked = "crew"
    SAM: Catching up with old friends. A dealer. A driver. A kid who's good with numbers.
- Kessler looks at you for a long moment. Then he holds out a business card. # mood: Kessler neutral
KESSLER: If you remember anything you'd like to tell me, call.
You slip the card into your pocket.
The car pulls away. You watch it until it turns the corner. # cast: Sam
-> hub

=== cliffhanger ===
A kid with a head for numbers, a dealer, a driver and a con artist. It's a crew. # panel: casino-floor # cast: Sam
You take a last look around the Gilded Crane before you leave.
A waiter appears at your elbow with a drink you didn't order. # cast: Sam, Waiter
WAITER: Compliments of the house.
Under the glass is a casino chip. Not one of Crane's: an old Crane & Hale chip, from the business you two ran together. Nobody has made those in five years. # mood: Sam shocked
You look up. # cast: Sam # mood: Sam angry
High above the floor, behind the glass of his office, Victor Crane raises his own drink to you. # panel: crane-window # cast: Crane
His lips move. You don't need to hear him to know what he's saying.
CRANE: Welcome home, Sam. # mood: Crane happy
He's smiling. # freeze
-> END
