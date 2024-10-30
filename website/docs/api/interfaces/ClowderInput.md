[**@bdelab/jscat**](../README.md) • **Docs**

***

[@bdelab/jscat](../globals.md) / ClowderInput

# Interface: ClowderInput

## Properties

### cats

> **cats**: `CatMap`\<[`CatInput`](CatInput.md)\>

An object containing Cat configurations for each Cat instance.
Keys correspond to Cat names, while values correspond to Cat configurations.

#### Defined in

[src/clowder.ts:19](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/clowder.ts#L19)

***

### corpus

> **corpus**: `MultiZetaStimulus`[]

An object containing arrays of stimuli for each corpus.

#### Defined in

[src/clowder.ts:23](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/clowder.ts#L23)

***

### earlyStopping?

> `optional` **earlyStopping**: [`EarlyStopping`](../classes/EarlyStopping.md)

An optional EarlyStopping instance to use for early stopping.

#### Defined in

[src/clowder.ts:31](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/clowder.ts#L31)

***

### randomSeed?

> `optional` **randomSeed**: `null` \| `string`

A random seed for reproducibility. If not provided, a random seed will be generated.

#### Defined in

[src/clowder.ts:27](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/clowder.ts#L27)
