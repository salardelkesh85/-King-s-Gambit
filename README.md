# King’s Gambit · شاه‌کش

A portrait Android lane battler. Select a eight-card deck with a rotating four-card hand, deploy fighters on your side of either bridge, and defend your crown tower. The first prototype supports offline battles against an AI opponent, three arenas, and a coin shop.

Build with JDK 17 and Gradle 8.9 using `gradle :app:assembleDebug`.

Version 0.2 uses the standalone Android application ID com.kingsgambit.arena. Ground units cross the bridges. Flying units can cross the river. Drag a card to deploy. Equal crown scores after three minutes trigger sudden death.

Version 0.3 adds a free Windcatcher building, a repeatable ram-defense drill, tile placement, persistent targets, per-unit attack windups, crown tower activation and counter-based AI. Existing decks are preserved. Pick Windcatcher in Cards and tap a deck slot to equip it for regular battles. In Ram defense drill compare the marked tile with its right-hand neighbor. Drill results do not change coins or trophies.
