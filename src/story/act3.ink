// House Edge, act three: heist night.
//
// Same conventions as act1.ink, plus `# minigame: <scene>`, which hands over
// to a hands-on scene after the line. Its outcome lands in <scene>_result.
// Flags from acts one and two are copied in by the player before the story
// starts; the defaults below stand in when there's no save.
//
// Running order (see the design doc): gala, poker, cameras, vault, check 1
// (Theo), Crane's office, check 2 (Vince), getaway, check 3 (Dee), the
// reveal, the epilogue. The first failed check decides the ending, and the
// scenes after it still play, except that once Sam goes after Theo, Crane
// burns the ledger before Vince can run with it.

// From act one.
VAR leaked = "vault"
VAR theo_rescue = "bluff"
VAR leo_open = false
VAR dee_wary = false
VAR vince_helped = false

// From act two.
VAR theo_safe = false
VAR vince_handled = false
VAR dee_won = false
VAR scout_poker = false
VAR scout_cameras = false
VAR scout_vault = false
VAR scout_getaway = false

// Set by the hands-on scenes.
VAR poker_result = ""   // clean, spotted, walked
VAR cameras_result = "" // clean, glitched, seen
VAR vault_result = ""   // clean, partial, noticed
VAR getaway_result = "" // clean, made, chased

// Act three.
VAR ending = ""         // cleared, caught, betrayed, theo
VAR theo_held = false   // Sam chose the proof over Theo
VAR proof_taken = false // Vince ran with the proof

-> gala

// ---- 1. The gala --------------------------------------------------------

=== gala ===
The gala # card
The Gilded Crane's anniversary gala. Gold balloons, a string quartet, and four hundred guests who think tonight is their night. # panel: casino-floor # cast: Sam
Leo is behind the glass of the cashier's cage, counting chips. Theo is in the van out back with his laptop. Vince is in the high-limit room. # cast: Sam, Leo
Up on the balcony, Victor Crane shakes hands with every guest who matters. # panel: crane-window # cast: Crane
One of them is Detective Ray Kessler, in a tuxedo that doesn't fit. # cast: Crane, Kessler
THEO: Comms check. Everyone hear me? # panel: casino-floor # cast: Sam
SAM: Loud and clear. Let's go to work.
-> poker

// ---- 2. Poker -----------------------------------------------------------

=== poker ===
The high-limit room. Behind the high roller's chair, his spare plaques sit in a rack on a side table, and Vince is drifting toward it. # panel: high-limit # cast: Sam, High Roller, Vince
Your job: keep the high roller looking at you. # minigame: poker
{ poker_result:
    - "clean":
        Vince strolls past the table, his jacket a little heavier, and winks. The high roller never looked his way. # cast: Sam, Vince
    - "spotted":
        Vince got the plaques, but the high roller watched him a beat too long. He'll know that face if he sees it again. # cast: Sam, High Roller
    - else:
        The high roller cashes out and leaves in a temper. Vince only got part of the rack. # cast: Sam, Vince
}
-> cameras

// ---- 3. Cameras ---------------------------------------------------------

=== cameras ===
THEO: Three corridors between you and the vault floor. I've got the loops. You've got the timing. # panel: corridor # cast: Sam
THEO: Watch the fans. # minigame: cameras
{ cameras_result:
    - "clean":
        THEO: Three clean cuts. The guard in the security room just watched three empty hallways.
    - "glitched":
        THEO: We're through, but one of those cuts jumped. If anyone checks the tapes, they'll see it.
    - else:
        THEO: You're through, but the loop ran out on you. You're on tape. I'm sorry.
}
-> vault

// ---- 4. The vault -------------------------------------------------------

=== vault ===
The vault floor. Leo has talked his way up from the cage and is telling the guard about his boat. # panel: vault-floor # cast: Sam, Leo, Guard
{ leaked == "vault": The new dial Crane had fitted yesterday morning stares back at you. | The dial stares back at you. }
LEO: ...and that's when I said, that's not a fish, that's my wife! # minigame: vault
{ vault_result:
    - "clean":
        The last tumbler drops. The door swings open, and the guard is still laughing at Leo's story.
    - "partial":
        The door opens just as the guard starts back. You have seconds, not minutes.
    - else:
        The door opens, but the guard saw the light under it. He's reaching for his radio.
}
Inside: cash, jewellery, bearer bonds. Shelves of it. # cast: Sam
No ledger. No file. Nothing with your name on it.
THEO: Sam... it's not here. The proof isn't here.
SAM: Keep the line open.
THEO: Did you hear me? It's not here!
You don't answer. You're watching the ceiling, waiting.
Every alarm in the Gilded Crane goes off at once.
-> check_theo

// ---- 5. Check 1: Theo ---------------------------------------------------

=== check_theo ===
{ theo_safe:
    Crane's men go looking for something to bargain with. They try the van, and Theo's brother's place. # panel: alley # cast: Guard
    But the debt is paid, the brother is out of town, and Theo is already gone. There's nothing to grab.
    -> crane_office
}
Your earpiece crackles. It isn't Theo. # panel: alley # cast: Theo, Guard
CRANE: Sam. I have your hacker. Bring me what you took from my vault, and he walks.
THEO: Don't! Sam, don't do it!
* [Go after Theo]
    ~ ending = "theo"
    You drop the bag and run for the service stairs. # panel: alley # cast: Sam, Theo, Guard
    You get Theo out the back with a split lip and his laptop under his arm.
    THEO: You came back for me.
    SAM: Nobody on my crew gets left behind.
    But the vault is open, Crane is in his office, and nobody is watching him.
* [Stick to the plan]
    ~ theo_held = true
    SAM: He's a kid, Crane. Hurt him and you've got a much bigger problem than me.
    You stay where you are. It's the hardest thing you've done in five years.
- -> crane_office

// ---- 6. Crane's office --------------------------------------------------

=== crane_office ===
Upstairs, Victor Crane locks his office door and pulls the picture frame off the wall. # panel: crane-window # cast: Crane
Behind it, a small safe. Inside, a leather ledger: five years old, with two signatures in it. His, and Kessler's.
He takes out his phone.
CRANE: Ray. They hit the vault. I'm burning your file before anyone finds it. If I go down, you go down with me.
On the vault floor, Leo presses a finger to his earpiece. The bug he planted behind that picture frame picks up every word. # panel: vault-floor # cast: Leo
LEO: Got it. Every word, and the name.
{ ending == "theo":
    By the time you're back inside, Crane has fed the ledger to the basement incinerator. # panel: crane-window # cast: Crane
    The recording is all you have left. On its own, it won't be enough.
    -> getaway
}
-> check_vince

// ---- 7. Check 2: Vince --------------------------------------------------

=== check_vince ===
Crane comes out of his office with the ledger in a briefcase, heading for the incinerator in the basement. # panel: office-hall # cast: Crane
Vince is in the corridor, a bag of plaques on his shoulder. He sees the briefcase, and he understands exactly what it's worth. # cast: Crane, Vince
He snatches it and runs.
{ vince_handled:
    He runs the way you knew he would: down the service stairs, to the side door, where Leo is waiting. # cast: Vince, Leo
    LEO: I'll take that.
    The plaques were never going to the account Vince thought they were, either. You made a phone call about that earlier in the week.
    VINCE: You knew. The whole time, you knew. # cast: Sam, Vince, Leo
    SAM: Old friend. You taught me everything I know.
- else:
    ~ proof_taken = true
    { ending == "":
        ~ ending = "betrayed"
    }
    By the time you reach the side door, Vince is gone. So are the plaques, and so is the proof. # cast: Sam
    Somewhere, a man with two passports is starting a new life with your name in his briefcase.
}
-> getaway

// ---- 8. The getaway -----------------------------------------------------

=== getaway ===
A black sedan screeches up to the side door, tyres smoking. # panel: casino-exterior # cast: Sam, Dee
DEE: Get in. Now.
You stop on the kerb and look up, past the neon, at the office window on the top floor.
For a second, you're almost smiling. # freeze
DEE: Sam! Where am I going? # panel: dee-car # cast: Sam, Dee
You've got the map. She's got the wheel. # minigame: getaway
{ getaway_result:
    - "clean":
        Dee pulls into the garage on Pier Street and kills the lights. Sirens pass a block away and fade. # panel: hideout # cast: Sam, Dee
    - "made":
        You make the garage, but the police got a good look at the car. It's burned. # panel: hideout # cast: Sam, Dee
    - else:
        Dee dumps the car in an alley and you run the last blocks on foot, lungs burning. # panel: hideout # cast: Sam, Dee
}
-> check_dee

// ---- 9. Check 3: Dee ----------------------------------------------------

=== check_dee ===
Dee turns round in the dark garage. She's holding a badge. # cast: Sam, Dee
DEE: Detective Dee Okafor. Undercover, eight months.
{ dee_won:
    She looks at the badge, then at you.
    DEE: Tell me you've got something on Kessler.
    { ending == "theo" or ending == "betrayed": SAM: Leo has him on tape, every word. It's not enough on its own. | SAM: Leo has him on tape, every word. And the ledger, with his signature in it. }
    DEE: Then you were working with me all along. That's what my report is going to say.
    { ending == "":
        ~ ending = "cleared"
    }
- else:
    DEE: Sam Hale, you're under arrest.
    SAM: You might want to hear a recording first.
    DEE: I'll hear it at the station.
    { ending == "":
        ~ ending = "caught"
    }
}
-> reveal

// ---- 10. The reveal -----------------------------------------------------

=== reveal ===
The reveal # card
Three weeks earlier, on the way to your motel, a car pulled up beside you. # panel: street-night # cast: Sam, Kessler # freeze
{ leaked:
    - "date": You told Kessler the date of the gala. You chose those words very carefully.
    - "vault": You told Kessler you'd come to see Crane's vault. You chose those words very carefully.
    - else: You told Kessler about your crew. You chose those words very carefully.
}
Because Kessler would run straight to Crane. And Crane, with a vault about to be robbed, would do the one thing he'd never done in five years: take the proof out of hiding.
Every time Crane moved, you stayed calm. You knew he would. # panel: hideout # cast: Sam
Kessler's card sat under your coffee cup the whole time, in plain sight.
And tonight, on the kerb outside the casino, you weren't looking at the vault. # panel: casino-exterior # cast: Sam # freeze
You were looking at the window of the man who had just shown you where the proof was.
The house always has the edge. Unless you're the one dealing.
-> epilogue

// ---- 11. Epilogue -------------------------------------------------------

=== epilogue ===
{ ending:
    - "cleared": -> name_cleared
    - "caught": -> caught
    - "betrayed": -> betrayed
    - else: -> protecting_theo
}

=== name_cleared ===
Name cleared # card
Victor Crane is arrested on his own balcony, still in his tuxedo. Detective Ray Kessler is arrested the next morning, at his desk. # panel: crane-window # cast: Crane, Kessler
Five years after you went to prison for Crane's crime, a judge reads your name out loud and the word after it is "innocent." # panel: casino-floor # cast: Sam, Leo, Theo, Dee
-> costs

=== caught ===
Caught # card
They take your crew in one by one: Vince, Theo, Leo and you. Dee does it by the book. # panel: street-night # cast: Sam, Dee
In the interview room, you ask them to play Leo's recording. Three weeks later, they do. # cast: Sam
Crane falls. So does Kessler. But you're still on the wrong side of the glass, waiting for a judge to decide what a thief with a good reason deserves.
-> costs

=== betrayed ===
Betrayed # card
Vince never calls. Somewhere in the sun, a man with your proof in his briefcase is spending Crane's money. # panel: gallery # cast: Vince
Leo's recording puts Kessler under investigation, but without the ledger, Crane's lawyers make it go away. # panel: crane-window # cast: Crane
You're free. You're just not innocent. Not on paper.
-> costs

=== protecting_theo ===
Protecting Theo # card
The ledger is ash. Leo's recording makes the papers, and the papers make Crane nervous, but nervous isn't guilty. # panel: crane-window # cast: Crane
Theo starts college in the autumn, paid for with what Leo carried out of the vault. He sends you a postcard from his first week. # panel: rooftop # cast: Sam, Theo
"You came back for me," it says. "Nobody ever came back for me."
-> costs

=== costs ===
{ poker_result == "spotted": The high roller picks Vince's face out of a book of mugshots, months later. # panel: city-map # cast: Sam }
{ poker_result == "walked" and not proof_taken: Vince complains, for a long time, about the plaques he never got. # panel: city-map # cast: Sam }
{ cameras_result == "glitched": When the security footage is reviewed, an analyst finds three seconds that jump. Nobody can explain them. # panel: city-map # cast: Sam }
{ cameras_result == "seen": Your crew's faces are on the casino's tapes, which makes everything afterwards harder. # panel: city-map # cast: Sam }
{ vault_result == "partial": You left half the vault behind. Theo still talks about it. # panel: city-map # cast: Sam }
{ vault_result == "noticed": The vault guard gives a very good description of you to the police. # panel: city-map # cast: Sam }
{ getaway_result == "made": The getaway car turns up in a police report with its plates circled. Dee has to explain that. # panel: city-map # cast: Sam }
{ getaway_result == "chased": The car you ditched still had the spare cash in the boot. # panel: city-map # cast: Sam }
{ theo_held: Theo forgives you for staying put that night. It takes him a year. # panel: city-map # cast: Sam }
The end # card
-> END
