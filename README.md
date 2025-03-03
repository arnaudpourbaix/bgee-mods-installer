# bgee-mods-installer

Automated mods install.
This is my own mod manager, without any UI, just command line tools.

It is designed to install a full mod list in one shot, by copying all mods from a network hard drive (and later on from git directory).
It can parse WeiDU.log to run a full installation.

## Compatibility

This is related to my own mod list, need to sort out install order for these mods:

EEex              
rr                
wsr               
dw_talents (just before stratagems)

SubtleD_Item_Tweaks
SubtleD_Spell_Tweaks
SubtleD_Stat_Overhauls


The Subtle Doctor order list:
[quest mods]
[NPC mods]
[spell mods including Spell Revisions]
[item mods including Item Revisions]
[small kit mods]
SubtleD's Spell Tweaks
Tome & Blood
Will to Power
Might and Guile
Faiths & Powers
5E Spellcasting Conversion
[tweak mods including Tweaks Anthology]
SubtleD's Item Tweaks
SCS
Combat Skills & Proficiencies
SubtleD's Stat Overhauls
[end-of-order mods like LevelOneNPCs, NPC_EE, Dual to Kit, etc.]

# Kit overlaps

## Fighter:
~ARTISANSKITPACK/ARTISANSKITPACK.TP2~ #0 #1100 // Artisan's Kitpack: Fighter Overhaul: 4.8
~ARTISANSKITPACK/ARTISANSKITPACK.TP2~ #0 #1003 // Artisan's Kitpack: Berserker Overhaul: 4.8
~ARTISANSKITPACK/ARTISANSKITPACK.TP2~ #0 #1006 // Artisan's Kitpack: Wizard Slayer Overhaul: 4.8
******************************** Wizard Slayer Rebalancing (aVENGER)
~ARTISANSKITPACK/ARTISANSKITPACK.TP2~ #0 #1004 // Artisan's Kitpack: Kensai Overhaul: 4.8
~SWORD_AND_FIST/SETUP-SWORD_AND_FIST.TP2~ #0 #30 // Install Hexblade fighter kit: v9
~SWORD_AND_FIST/SETUP-SWORD_AND_FIST.TP2~ #0 #31 // Install Duelist fighter kit: v9
~SWORD_AND_FIST/SETUP-SWORD_AND_FIST.TP2~ #0 #32 // Install Fist of Order fighter kit: v9
~SWORD_AND_FIST/SETUP-SWORD_AND_FIST.TP2~ #0 #34 // Install Duskblade fighter kit: v9
~MIGHT_AND_GUILE/MIGHT_AND_GUILE.TP2~ #0 #60 // Add the Sohei Warrior (fighter kit): 5.8.9
~MIGHT_AND_GUILE/MIGHT_AND_GUILE.TP2~ #0 #65 // Add the Ironsmith (fighter kit): 5.8.9
~ARTISANSKITPACK/ARTISANSKITPACK.TP2~ #0 #1007 // Artisan's Kitpack: Dwarven Defender Overhaul + Vanguard Fighter Kit: 4.8
~ARTISANSKITPACK/ARTISANSKITPACK.TP2~ #0 #1000 // Artisan's Kitpack: Arcane Archer Fighter Kit: 4.8
~ARTISANSKITPACK/ARTISANSKITPACK.TP2~ #0 #1008 // Artisan's Kitpack: Siegemaster Fighter Kit: 4.8
~ARTISANSKITPACK/ARTISANSKITPACK.TP2~ #0 #1009 // Artisan's Kitpack: Dreadnought Fighter Kit: 4.8
~ARTISANSKITPACK/ARTISANSKITPACK.TP2~ #0 #1005 // Artisan's Kitpack: Barbarian Overhaul: 4.8


## Ranger:
~ARTISANSKITPACK/ARTISANSKITPACK.TP2~ #0 #2000 // Artisan's Kitpack: Ranger Overhaul: 4.8
~ARTISANSKITPACK/ARTISANSKITPACK.TP2~ #0 #2010 // Artisan's Kitpack: Archer Overhaul: 4.8
~ARTISANSKITPACK/ARTISANSKITPACK.TP2~ #0 #2011 // Artisan's Kitpack: Stalker Overhaul: 4.8
~ARTISANSKITPACK/ARTISANSKITPACK.TP2~ #0 #2012 // Artisan's Kitpack: Beast Master Overhaul: 4.8
~ARTISANSKITPACK/ARTISANSKITPACK.TP2~ #0 #2002 // Artisan's Kitpack: Dark Hunter Ranger Kit: 4.8
~MIGHT_AND_GUILE/MIGHT_AND_GUILE.TP2~ #0 #125 // Add the Mage Hunter (ranger kit): 5.8.9
~MIGHT_AND_GUILE/MIGHT_AND_GUILE.TP2~ #0 #155 // Add the Elven Archer (ranger kit): 5.8.9
~MIGHT_AND_GUILE/MIGHT_AND_GUILE.TP2~ #0 #120 // Add Regional Ranger kits: 5.8.9

~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Ranger  (Base)
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Forest ranger
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Mountain ranger
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Desert ranger
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Jungle ranger 
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Arctic ranger
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Beast Master
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Barbarian Ranger
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Mage Hunter
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Elven Archer
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Halfling Slinger


## Paladin:
******************************** ~IHATEUNDEAD/IHATEUNDEAD.TP2~ #0 #3 // Undead Hunter Revision (Paladin Kit): 3.8.3
~ARTISANSKITPACK/ARTISANSKITPACK.TP2~ #0 #3011 // Artisan's Kitpack: Undead Hunter Overhaul: 4.8
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Knight of Eternal Order (replaces Undead Hunter)
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Harvester of Myrkul (replaces Undead Hunter)
//TODO: test if Undead Hunter is accessible after FnP install

~ARTISANSKITPACK/ARTISANSKITPACK.TP2~ #0 #3000 // Artisan's Kitpack: Paladin Overhaul: 4.8
~ARTISANSKITPACK/ARTISANSKITPACK.TP2~ #0 #3010 // Artisan's Kitpack: Cavalier Overhaul: 4.8
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Inquisitor of Azuth (replaces Inquisitor)
******************************** ~ARTISANSKITPACK/ARTISANSKITPACK.TP2~ #0 #3003 // Artisan's Kitpack: Inquisitor Overhaul: 4.8
~ARTISANSKITPACK/ARTISANSKITPACK.TP2~ #0 #3004 // Artisan's Kitpack: Blackguard Overhaul: 4.8
~ARTISANSKITPACK/ARTISANSKITPACK.TP2~ #0 #3001 // Artisan's Kitpack: Divine Champion Paladin Kit: 4.8
~ARTISANSKITPACK/ARTISANSKITPACK.TP2~ #0 #3002 // Artisan's Kitpack: Mystic Fire Paladin Kit: 4.8
~ARTISANSKITPACK/ARTISANSKITPACK.TP2~ #0 #3005 // Artisan's Kitpack: Martyr Paladin Kit: 4.8
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Champion (Base)
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Zealot (Base)
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Knight of the Black Gauntlet
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Everwatch Knight
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Hammer of Moradin (Dwarf)
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Truesword of Arvoreen (Dwarf)


## Monk:
~ARTISANSKITPACK/ARTISANSKITPACK.TP2~ #0 #10001 // Artisan's Kitpack: Monk Revisions: 4.8
******************************** ~MIGHT_AND_GUILE/MIGHT_AND_GUILE.TP2~ #0 #265 // Revised Monk Fists: 5.8.9
~ARTISANSKITPACK/ARTISANSKITPACK.TP2~ #0 #10002 // Artisan's Kitpack: Brawler Kit: 4.8


## Cleric:
******************************** ~IHATEUNDEAD/IHATEUNDEAD.TP2~ #0 #1 // Holy Redeemer (Cleric Kit): 3.8.3
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Magistrati of Azuth
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Doommaster of Beshaba
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Sworn of Cyric
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Glyphscribe of Deneir
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Watcher of Helm
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Painbearer of Ilmater
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Doomguide of Kelemvor
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Dawnbringer of Lathander
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Mistwalker of Leira
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Paingiver of Loviatar
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Talon of Malar
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Minion of Moander
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Weavekeeper of Mystra
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Seeker of Oghma
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Darkcloak of Shar
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Heartwarder of Sune
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Stormbringer of Talos
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Battleguard of Tempus
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Broken Blade of Tempus
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Hand of Torm
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Luckrider of Tymora
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Waveservant of Umberlee
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Sonnlinor of Moradin (Dwarf)
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Alaghor of Clangeddin (Dwarf)
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Volamtar of Marthammor Duin (Dwarf)
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Hoodwinker of Baravar Cloakshadow (Gnome)
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Fastpaws of Baervan (Gnome)
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Bloodstalker of Urdlen (Gnome)
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Horn Guard of Yondalla (Halfing)
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Defender of Arvoreen (Halfing)
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Ur-Priest


## Druid:
~ARTISANSKITPACK/ARTISANSKITPACK.TP2~ #0 #5100 // Artisan's Kitpack: Shapeshifter Overhaul: 4.8
~IHATEUNDEAD/IHATEUNDEAD.TP2~ #0 #7 // Circle Enforcer (Druid Kit): 3.8.3
~ARTISANSKITPACK/ARTISANSKITPACK.TP2~ #0 #5001 // Artisan's Kitpack: Elementalist Druid Kit: 4.8

~ARTISANSKITPACK/ARTISANSKITPACK.TP2~ #0 #5002 // Artisan's Kitpack: Hivemaster Druid Kit: 4.8
******************************** ~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Hivekeeper (replaces Avenger)

~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Forest Druid (Base Class)
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Totemic Druid
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Northern Druid
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Shadow Druid
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Lost Druid
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Beast Lord
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Elementalist
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Earth Mystic
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Water Mystic
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Air Mystic
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Fire Mystic
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Light Mystic
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ Shadow Mystic


## Shaman:
~IHATEUNDEAD/IHATEUNDEAD.TP2~ #0 #10 // Dreadful Witch (Shaman Kit): 3.8.3
~ARTISANSKITPACK/ARTISANSKITPACK.TP2~ #0 #9001 // Artisan's Kitpack: Warhorn Shaman Kit: 4.8


## Wizard:

## Sorcerer:
******************************** ~TOMEANDBLOOD/TOMEANDBLOOD.TP2~ #0 #20 // Revised Dragon Disciples: 1.0.1
~ARTISANSKITPACK/ARTISANSKITPACK.TP2~ #0 #8002 // Artisan's Kitpack: 3e-accurate Dragon Disciple -> Original Stat Bonuses: 4.8
~TOMEANDBLOOD/TOMEANDBLOOD.TP2~ #0 #25 // Sorcerer: Magus: 1.0.1
~TOMEANDBLOOD/TOMEANDBLOOD.TP2~ #0 #31 // Sorcerer: Favored Soul: 1.0.1
~IHATEUNDEAD/IHATEUNDEAD.TP2~ #0 #11 // Imprisoned Soul (Sorcerer Kit): 3.8.3
~TOMEANDBLOOD/TOMEANDBLOOD.TP2~ #0 #33 // Sorcerer: Sylvan Disciple: 1.0.1
~TOMEANDBLOOD/TOMEANDBLOOD.TP2~ #0 #35 // Sorcerer: Revenant Disciple: 1.0.1
~TOMEANDBLOOD/TOMEANDBLOOD.TP2~ #0 #37 // Sorcerer: Amorphous Disciple: 1.0.1
~ARTISANSKITPACK/ARTISANSKITPACK.TP2~ #0 #8001 // Artisan's Kitpack: Pale Master Sorcerer Kit: 4.8


## Bard:
~SONG_AND_SILENCE/SETUP-SONG_AND_SILENCE.TP2~ #0 #0 // Changes to trueclass bards and thieves, and unmodded game kits (required for other components): v19
~RR/SETUP-RR.TP2~ #0 #4 // Bard kit revisions: v4.92
******************************** ~RR/SETUP-RR.TP2~ #0 #6 // Proper spell progression for Bards: v4.92
~BARDICWONDERS/BARDICWONDERS.TP2~ #0 #0 // Bardic Wonders: Blade Overhaul
~BARDICWONDERS/BARDICWONDERS.TP2~ #0 #1 // Bardic Wonders: Jester Overhaul
~BARDICWONDERS/BARDICWONDERS.TP2~ #0 #2 // Bardic Wonders: Skald Overhaul
~MIGHT_AND_GUILE/MIGHT_AND_GUILE.TP2~ #0 #450 // Add the Jongleur (bard kit): 5.8.9
~MIGHT_AND_GUILE/MIGHT_AND_GUILE.TP2~ #0 #460 // Add the Loremaster (bard kit): 5.8.9
~MIGHT_AND_GUILE/MIGHT_AND_GUILE.TP2~ #0 #470 // Add the Gallant (bard kit): 5.8.9
~MIGHT_AND_GUILE/MIGHT_AND_GUILE.TP2~ #0 #490 // Add the Loresinger (bard kit): 5.8.9
~SONG_AND_SILENCE/SETUP-SONG_AND_SILENCE.TP2~ #0 #2 // Install Acrobat bard kit: v19
~SONG_AND_SILENCE/SETUP-SONG_AND_SILENCE.TP2~ #0 #4 // Install Dirgesinger bard kit: v19
~BARDICWONDERS/BARDICWONDERS.TP2~ #0 #3 // Bardic Wonders: Abettor of Mask Kit
~BARDICWONDERS/BARDICWONDERS.TP2~ #0 #4 // Bardic Wonders: Dancer Kit
~BARDICWONDERS/BARDICWONDERS.TP2~ #0 #5 // Bardic Wonders: Darkbloom Bard Kit
~BARDICWONDERS/BARDICWONDERS.TP2~ #0 #6 // Bardic Wonders: Storm Drummer Kit
~BARDICWONDERS/BARDICWONDERS.TP2~ #0 #7 // Bardic Wonders: Troubadour Kit
~BARDICWONDERS/BARDICWONDERS.TP2~ #0 #8 // Bardic Wonders: Deathsinger Kit
~BARDICWONDERS/BARDICWONDERS.TP2~ #0 #9 // Bardic Wonders: Strategist Kit
~BARDICWONDERS/BARDICWONDERS.TP2~ #0 #10 // Bardic Wonders: Kapellmeister Kit
~BARDICWONDERS/BARDICWONDERS.TP2~ #0 #13 // Bardic Wonders: Armored Casting for Bards
~BARDICWONDERS/BARDICWONDERS.TP2~ #0 #16 // Bardic Wonders: Bard Song Overhead Visual Effect
~BARDICWONDERS/BARDICWONDERS.TP2~ #0 #17 // Bardic Wonders: High Level Abilities


## Thief:
******************************** ~RR/SETUP-RR.TP2~ #0 #1 // Thief kit revisions: v4.92
~ARTISANSKITPACK/ARTISANSKITPACK.TP2~ #0 #7004 // Artisan's Kitpack: Assassin Overhaul: 4.8
~ARTISANSKITPACK/ARTISANSKITPACK.TP2~ #0 #7006 // Artisan's Kitpack: Swashbuckler Overhaul: 4.8
~ARTISANSKITPACK/ARTISANSKITPACK.TP2~ #0 #7001 // Artisan's Kitpack: Rogue Archer Thief Kit: 4.8
~SONG_AND_SILENCE/SETUP-SONG_AND_SILENCE.TP2~ #0 #6 // Install Adventurer thief kit: v19
~SONG_AND_SILENCE/SETUP-SONG_AND_SILENCE.TP2~ #0 #7 // Install Burglar thief kit: v19
~SONG_AND_SILENCE/SETUP-SONG_AND_SILENCE.TP2~ #0 #9 // Install Sharpshooter thief kit: v19
~IHATEUNDEAD/IHATEUNDEAD.TP2~ #0 #4 // Death Tricker (Thief Kit): 3.8.3
~MIGHT_AND_GUILE/MIGHT_AND_GUILE.TP2~ #0 #96 // Add the Ninja (thief kit): 5.8.9
~ARTISANSKITPACK/ARTISANSKITPACK.TP2~ #0 #7002 // Artisan's Kitpack: Magekiller Thief Kit: 4.8
~ARTISANSKITPACK/ARTISANSKITPACK.TP2~ #0 #7003 // Artisan's Kitpack: Trickster Thief Kit: 4.8
~ARTISANSKITPACK/ARTISANSKITPACK.TP2~ #0 #7005 // Artisan's Kitpack: Invisible Blade Thief Kit: 4.8


## Multiclass

~ARTISANSKITPACK/ARTISANSKITPACK.TP2~ #0 #20000 // Artisan's Kitpack: Eldritch Knight (Fighter / Mage Kit): 4.8
~ARTISANSKITPACK/ARTISANSKITPACK.TP2~ #0 #20001 // Artisan's Kitpack: Arcane Trickster (Mage / Thief Kit): 4.8
~ARTISANSKITPACK/ARTISANSKITPACK.TP2~ #0 #1001 // Artisan's Kitpack: Arcane Archer (Fighter/Mage): 4.8
~MIGHT_AND_GUILE/MIGHT_AND_GUILE.TP2~ #0 #80 // Add the Tomb Runner (fighter/thief kit): 5.8.9
~MIGHT_AND_GUILE/MIGHT_AND_GUILE.TP2~ #0 #85 // Add the Thug (fighter/thief kit): 5.8.9
~MIGHT_AND_GUILE/MIGHT_AND_GUILE.TP2~ #0 #105 // Add the Spellfilcher (mage/thief kit): 5.8.9
~MIGHT_AND_GUILE/MIGHT_AND_GUILE.TP2~ #0 #110 // Add the Loremaster (mage/thief kit): 5.8.9
~MIGHT_AND_GUILE/MIGHT_AND_GUILE.TP2~ #0 #160 // Add the Halfling Slinger (fighter/thief kit): 5.8.9


## Special
******************************** ~MIGHT_AND_GUILE/MIGHT_AND_GUILE.TP2~ #0 #280 // Revised Backstabbing: 5.8.9


# Talents of Faerun

## dw_talents.ini

### rebalanced kits

Disable all kits but rebalance_totemic_druid.

## errors

Multiclass/dual-class cleric/ranger and druid/ranger kits

# FnP

~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ #0 #12 // Revised Cleric Spell Table -> Faiths & Powers Table: 0.91.4
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ #0 #15 // Druids Use Cleric Spell Table and XP Table: 0.91.4
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ #0 #25 // Choose a Sphere System -> nuFnP: a new sphere system (fewer spheres, more balanced, closer to PnP): 0.91.4
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ #0 #31 // Install Cleric kits: 0.91.4
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ #0 #33 // Install Druid kits: 0.91.4
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ #0 #36 // Install Paladin kits -> ...for all those, PLUS Neutral/Evil/demihuman deities: 0.91.4
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ #0 #75 // Alter Priests' Weapon/Armor Usability: 0.91.4
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ #0 #80 // Apply Sphere System (REQUIRED for the sphere system to work): 0.91.4
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ #0 #91 // Multiclass Druids: 0.91.4
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ #0 #92 // Multiclass Shamans: 0.91.4
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ #0 #95 // Multiclass Cleric kits (install AFTER all other kit mods!!): 0.91.4
~FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2~ #0 #99 // Apply FnP Multiclass Kits to NPCs: 0.91.4


weidu DW_TALENTS/DW_TALENTS.TP2 --language 0 --no-exit-pause --noautoupdate --force-install-list 1500 1510 1520 2000 2500 2510 20000 40100 40150 40752 40800 40900
pause
weidu FAITHS_AND_POWERS/FAITHS_AND_POWERS.TP2 --language 0 --no-exit-pause --noautoupdate --force-install-list 12 15 25 31 33 36 45 75 80 91 92 95 99
pause

~MIGHT_AND_GUILE/MIGHT_AND_GUILE.TP2~ #0 #50 // Move the Cavalier to the Fighter Class: 5.8.9
~MIGHT_AND_GUILE/MIGHT_AND_GUILE.TP2~ #0 #151 // Move the Archer to the Fighter Class: 5.8.9

weidu ITEM_REV/ITEM_REV.TP2 --language 0 --no-exit-pause --noautoupdate --force-install-list 17 1080 1200 15 1060
weidu DW_TALENTS/DW_TALENTS.TP2 --language 0 --no-exit-pause --noautoupdate --force-install-list 20000 40100 40150 40650 40752 40800 40900 40925 41000 50200 50400 50500 55000 55100 55200 55300 55400 55500 55700 55800 55900 80001 80102 80150 80160 81011 81020 81030 81200 90100
