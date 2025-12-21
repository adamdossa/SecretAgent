# Silver Leigh Secret Agents

## Overview

Our family gathers every year at Silver Leigh - the house of David and Rosanne (grandparents).

We are building a game which will be played via a web site on each persons phone or iPad.

The game consists of two main parts - Secret Tells and Secret Missions.

Secret Tells - something like "You have to touch your ear every time someone says Christmas". Everyone tries to guess other peoples secret tells.

Secret Missions - something like "You have to get someone to offer you a drink, without asking". You have to get it done at some point during the day. You can get multiple points if you do it multiple times.

As a side game, the players will also suggest team names (the names aren't relevant here, but are used for an offline game separately). The AI can be the judge of the best name for each team.

AI will be used to provide multiple options for players to choose from for both tasks.

## Detailed Specification

### Components

#### Web Page

- Written in typescript or javascript, using React where appropriate.

- Aesthetics should be christmassy, with red as a main theme.

- Aim for simplicity in design and UX - some players are young!

- To get in to the webpage, there should be a simple password like "Hughes2026".

- The web page should be easily readable from mobile (most people will be using their phones) and tablets.

#### Admin

Adam (as the host of the game) will have access to a special Admin screen.

All the Admin screen shows is:
- which family members have successfully logged in

- has everyone chosen a secret tell and secret mission (but not the details)

- who has made suggestions (but not the details)

- the ability to finish the game and move everyone to the prize screens

- the ability to restart the game

#### Backend

- We expect to need a database to store peoples chosen options, suggestions and so on.

- It should be easy to run locally on a macbook or linux box.

- It can be simple as this is just being used as a one-off for a family game.

### Initial Setup

To get in to the web game, everyone will load the webpage on their phones or iPads.

They will need to enter:
- name

- team name suggestion

- password

Since we know all the players, we can make it easy for people to select their names.

The full list of names are below - we've also provided team names, although these aren't very relevant within the online part of the game.

The full family that gather are:
Grandpa David
Grandma Rosanne
Granty Elaine (Rosanne's sister)
Katherine, Vicky, Emily - Rosanne and David's daughters
Adam, Alex, Neal - their respective husbands
Ben & Lizzy (Adam & Katherines kids)
Jemima & Olivia (Alex & Vickys kids)

Teams are:
David, Neal, Emily, Lizzy - Team 1
Rosanne, Adam, Katherine, Ben - Team 2
Elaine, Alex, Vicky, Jemima, Olivia - Team 3

### Secret Tells

- Each player will be presented with a list of 3 options.

- Each option should be generated via the OpenAI API with a suitable prompt.

- It's important that players receive different options, so the backend will need to coordinate this.

- Players select their preferred option.

- They will then be presented with a new screen with a reminder of their chosen task, ideally a relevant small image (generated via OpenAI API) and the option to submit guesses of other players secret tells.

- You can change your guess of another players secret tell, but you can only ever have one guess per player in play.

- You can also view the guesses that other players have made about you.

- The game finishes when the Admin (Adam) selects that in the Admin screen

- We should use AI (OpenAI API) to judge and score each player:
  - One point if you correctly guessed another players tell. The AI can be more generous for the younger kids.
  - An extra point for every hour (before the game ends) that you had your final correct guess in.
  - One point for every 2 people who did not correctly guess your tell (give a point if the number is odd)

### Secret Mission

- Similar to the above, but players are presented with secret missions instead as secret tells.

- The player has a button they can click to record every time they complete their mission, adding the other players that were involved, and recording the time.

- Considering the above, make sure the prompt to create the missions takes into account that they shouldn't be too easy (since we don't want players to do them too many times) and involve other people who might spot they are being used in a mission.

- Players receive one point for every time they complete their mission - but each mission must be with a different person.

### Prize Section

- Once the Admin (Adam) ends the game, every player can see the prize section.

- Points are shown for each player, and each team.

- The AI also says what chosen team name is - the player who is chosen gets an extra point.

- Secret Missions and Tells are shown for each player, alongside the other players guesses.

- This is quite a lot of information, primarily to be displayed on mobile, so think carefully about the design and UX for this section.