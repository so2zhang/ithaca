# Turn a debrief into profile updates

Below is a debrief conversation between Bee (a matchmaker) and {{user_name}} about a group Plan.

## People in the group (use these exact names)
{{members}}

## Her current preference weights (0 = doesn't matter, 1 = matters a lot)
{{weights}}

Attribute meanings: career = career-driven/ambitious, outdoors = outdoorsy/active, creative = creative/musical, nightlife = big nights out/bars, bookish = intellectual/bookish.

## Transcript
{{transcript}}

## What to return
- `people`: one entry per group member she actually talked about. Skip anyone she didn't mention.
  - `chemistry`: integer 1–5 (1 = bad, 3 = fine, 5 = real spark)
  - `wants_to_see_again`: yes / no / maybe, from what she said
  - `vibe`: romantic / friend / neither
  - `evidence`: a short exact quote from HER (not Bee), under 15 words
- `preference_updates`: only attributes where the conversation gives real evidence of change. `old_weight` = her current weight above. `new_weight` between 0 and 1; move at most 0.5. `direction` up/down. `evidence` = short exact quote from her. `stated_vs_revealed` = true when what she showed (who she clicked with, what she enjoyed) contradicts what her current weights say she wants.
- `summary`: 1–2 sentences, plain and specific.

Base everything on what she said. If she didn't say it, leave it out.
