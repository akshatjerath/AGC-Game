/* THE IDLE REGISTER: story data
   Edit captions, choices, timers and ending text here. No code changes needed.

   Each beat:
     video    file name in videos/ (and the poster in images/)
     line     caption shown while the picture is revealed ({name} = player's name)
     secs     choice timer in seconds
     timeout  value chosen if the timer runs out
     next     video to preload while the player decides
     choices  [label, value, requirement?, reason shown when locked?]
              requirement is a flag name or test checked in game.js (see REQ)
*/

const STORY = {
  b00: { video: "b00_charter", line: "1996. The representative offers a pen.", secs: 15, timeout: "wait", next: "b01_ration_drop",
         choices: [["Sign the Charter", "sign"]] },
  b00_again: { line: "The representative holds the pen out again." },

  b01: { video: "b01_ration_drop", line: "Certified Yield, Citizen {name}. Standard weight.", secs: 10, timeout: "sign", next: "b02_line4",
         choices: [["Sign: “Thank you for the harvest”", "sign"]] },

  b02: { video: "b02_line4", line: "Old Miller collapses. “Keep the line moving.”", secs: 7, timeout: "feed", next: "b03_short_rations",
         choices: [["Keep feeding the belt", "feed"], ["Stop the belt, call the med-drum", "stop"]] },

  b03: { video: "b03_short_rations", line: "A coworker's tin comes up empty.", secs: 10, timeout: "keep", next: "b04_meera_package",
         choices: [["Split your ration", "share"], ["Keep it", "keep"]] },

  b04: { video: "b04_meera_package", line: "Your coworker Meera: “Take this. Don't look at me.”", secs: 8, timeout: "dump", next: "b05_unit4b_vikram",
         choices: [["Hide it in your coat", "hide"], ["Report Meera to Vane", "report"], ["Drop it in the chute", "dump"]] },

  tally: { video: "x_tallyman", line: "Supervisor Vane approves your promotion." },
  obey:  { video: "x_obedience", line: "Every quota met. Every sack sealed." },

  b05: { video: "b05_unit4b_vikram", line: "“I'm not hungry.”", secs: 10, timeout: "eat", next: "b06_sprout",
         choices: [["Share a sliver, tell him where it came from", "share"], ["Eat it all", "eat"]] },

  b06_warm: { video: "b06_sprout", line: "The floorboard is already warm. Someone was here before you." },
  b06: { video: "b06_sprout", line: "Six weeks later. Green, in a ration tin.", secs: 10, timeout: "hide", next: "b07_torn_label",
         choices: [["Hide and water it", "hide"]] },

  b07: { video: "b07_torn_label", line: "“They built it to die.”", secs: 10, timeout: "burn", next: "b08_meera_panics",
         choices: [["Hide it under the floor", "hide"], ["Burn it", "burn"]] },

  b08: { video: "b08_meera_panics", line: "Scent tags on the sack. Meera thinks she'll be traced.", secs: 10, timeout: "away", next: "b09_sweep",
         choices: [["“Protect yourself. I won't name you.”", "grace"], ["“Stay away from me.”", "away"]] },

  b09: { video: "b09_sweep", line: "“Unsanctioned biological activity. Open all floorboards.”", secs: 7, timeout: "stay", next: "b10_archive",
         choices: [["Slip out during the sweep", "slip"], ["Stay and hold the floorboard", "stay"]] },

  b10: { video: "b10_archive", line: "A sealed lab. The sterility data is still on a drive.", secs: 10, timeout: "leave", next: "b11_badge",
         choices: [["Copy the data", "copy", "awake3", "you burned the torn label"], ["Leave it", "leave"]] },

  b11: { video: "b11_badge", line: "A Terrace District badge, for a price.", secs: 10, timeout: "refuse", next: "b12_truck3",
         choices: [["Refuse the badge", "refuse"], ["Buy it", "buy"]] },

  b12: { video: "b12_truck3", line: "“Third truck. The driver doesn't check the cinders.”", secs: 10, timeout: "keep", next: "b13_ledger",
         choices: [["Bury the tin under the slag", "bury", "trusted", "Meera no longer trusts you"], ["Keep the tin", "keep"]] },

  b13: { video: "b13_ledger", line: "The ledger is read in the square.", next: "b14_broadcast" },

  b14: { video: "b14_broadcast", line: "The district loudspeakers. One switch.", secs: 10, timeout: "silent", next: "b15_stairwell",
         choices: [["Broadcast the sterility data", "cast", "hasData", "you never copied the archive"], ["Stay silent", "silent"]] },

  b15: { video: "b15_stairwell", line: "Boots on the stairs. Vikram's hand covers yours. Not choosing is also a choice.", secs: 60, timeout: "wait",
         choices: [["Open the door", "surrender"], ["Burn the flat", "burn"]] }
};

const ENDS = [
  ["e0_unsigned_soil", "The Unsigned Soil", "Vikram never signed. His family lives outside the walls, digging bitter roots, owned by no one."],
  ["e1_wild_bloom", "The Wild Bloom", "The seed reached open ground and the truth reached every loudspeaker. The hillside is green."],
  ["e2_one_root", "One Root in the Dust", "No one heard the truth, but one sapling took hold beyond the quarry."],
  ["e3_ledger_continues", "The Ledger Continues", "Your name was read in the square. Beneath the floorboard, a seed waits for the next pair of hands."],
  ["e4_gilded_cage", "The Gilded Cage", "You traded Meera for a Terrace window. The plants up here are licensed, and they never fruit."],
  ["e5_certified_yield", "Certified Yield", "Every quota met. Every sack sealed. The system did not need to win; it only needed you to comply."],
  ["e6_second_harvest", "The Second Harvest", "Someone lifted your floorboard. What you hid has grown into the house."],
  ["e7_unarmed_procession", "The Unarmed Procession", "Three people and a sprout walked out of the gate. No law had a word for it."]
];

/* Thresholds used by the endings */
const RULES = { bloomReadiness: 75, rootReadiness: 40, trustToSmuggle: 20, awarenessForData: 2, revealMs: 4500, revealMsSlow: 6000, slowTimerFactor: 1.8 };
