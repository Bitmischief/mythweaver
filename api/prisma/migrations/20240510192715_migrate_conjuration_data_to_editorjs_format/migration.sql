UPDATE "conjurations"
SET "data" = json_build_object(
    'time', 1715128308723,
    'blocks', json_build_array(
        json_build_object(
            'id', nanoid(10),
            'data', json_build_object(
                'text', "dataBackup"::json ->> 'background',
                'label', 'Background',
                'prompt', 'Generate a background for this NPC'
            ),
            'type', 'generationBlock'
        ),
        json_build_object(
            'id', nanoid(10),
            'data', json_build_object(
                'text', "dataBackup"::json ->> 'personality',
                'label', 'Personality',
                'prompt', 'Generate a personality for this NPC'
            ),
            'type', 'generationBlock'
        ),
        json_build_object(
            'id', nanoid(10),
            'data', json_build_object(
                'text', "dataBackup"::json ->> 'looks',
                'label', 'Looks',
                'prompt', 'Generate looks for this NPC'
            ),
            'type', 'generationBlock'
        ),
        json_build_object(
            'id', nanoid(10),
            'data', json_build_object(
                'text', "dataBackup"::json ->> 'quirks',
                'label', 'Quirks',
                'prompt', 'Generate quirks for this NPC'
            ),
            'type', 'generationBlock'
        ),
        json_build_object(
            'id', nanoid(10),
            'data', json_build_object(
                'text', "dataBackup"::json ->> 'hobbies',
                'label', 'Hobbies',
                'prompt', 'Generate hobbies for this NPC'
            ),
            'type', 'generationBlock'
        ),
        json_build_object(
            'id', nanoid(10),
            'data', json_build_object(
                'text', "dataBackup"::json ->> 'fears',
                'label', 'Fears',
                'prompt', 'Generate fears for this NPC'
            ),
            'type', 'generationBlock'
        )
    ),
    'version', '2.29.1'
)
WHERE "conjurerCode" = 'characters';

UPDATE "conjurations"
SET "data" = json_build_object(
    'time', 1715128308723,
    'blocks', json_build_array(
        json_build_object(
            'id', nanoid(10),
            'data', json_build_object(
                'text', "dataBackup"::json ->> 'history',
                'label', 'History',
                'prompt', 'Generate a history for this Location'
            ),
            'type', 'generationBlock'
        )
    ),
    'version', '2.29.1'
)
WHERE "conjurerCode" = 'locations';

UPDATE "conjurations"
SET "data" = json_build_object(
    'time', 1715128308723,
    'blocks', json_build_array(
        json_build_object(
            'id', nanoid(10),
            'data', json_build_object(
                'text', "dataBackup"::json ->> 'magicalProperties',
                'label', 'Magical Properties',
                'prompt', 'Generate magical properties for this Magic Item'
            ),
            'type', 'generationBlock'
        ),
        json_build_object(
            'id', nanoid(10),
            'data', json_build_object(
                'text', "dataBackup"::json ->> 'description',
                'label', 'Description',
                'prompt', 'Generate a description for this Magic Item'
            ),
            'type', 'generationBlock'
        ),
        json_build_object(
            'id', nanoid(10),
            'data', json_build_object(
                'text', "dataBackup"::json ->> 'rarity',
                'label', 'Rarity',
                'prompt', 'Generate a rarity for this Magic Item'
            ),
            'type', 'generationBlock'
        ),
        json_build_object(
            'id', nanoid(10),
            'data', json_build_object(
                'text', "dataBackup"::json ->> 'value',
                'label', 'Value',
                'prompt', 'Generate a value in gold for this Magic Item'
            ),
            'type', 'generationBlock'
        )
    ),
    'version', '2.29.1'
)
WHERE "conjurerCode" = 'items';

UPDATE "conjurations"
SET "data" = json_build_object(
    'time', 1715128308723,
    'blocks', json_build_array(
        json_build_object(
            'id', nanoid(10),
            'data', json_build_object(
                'text', "dataBackup"::json ->> 'description',
                'label', 'Description',
                'prompt', 'Generate a description for this Monster'
            ),
            'type', 'generationBlock'
        ),
        json_build_object(
            'id', nanoid(10),
            'data', json_build_object(
                'text', "dataBackup"::json ->> 'specialAbilities',
                'label', 'Special Abilities',
                'prompt', 'Generate special abilities for this Monster'
            ),
            'type', 'generationBlock'
        ),
        json_build_object(
            'id', nanoid(10),
            'data', json_build_object(
                'text', "dataBackup"::json ->> 'storyImpact',
                'label', 'Story Impact',
                'prompt', 'Generate the story impact for this Monster'
            ),
            'type', 'generationBlock'
        ),
        json_build_object(
            'id', nanoid(10),
            'data', json_build_object(
                'text', "dataBackup"::json ->> 'playerInteraction',
                'label', 'Player Interaction',
                'prompt', 'Generate the player interaction for this Monster'
            ),
            'type', 'generationBlock'
        )
    ),
    'version', '2.29.1'
)
WHERE "conjurerCode" = 'monsters';
