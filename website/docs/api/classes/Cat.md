[**@bdelab/jscat**](../README.md) • **Docs**

***

[@bdelab/jscat](../globals.md) / Cat

# Class: Cat

## Constructors

### new Cat()

> **new Cat**(`__namedParameters`?): [`Cat`](Cat.md)

Create a Cat object. This expects an single object parameter with the following keys

#### Parameters

• **\_\_namedParameters?**: [`CatInput`](../interfaces/CatInput.md) = `{}`

#### Returns

[`Cat`](Cat.md)

#### Defined in

[src/cat.ts:50](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/cat.ts#L50)

## Properties

### itemSelect

> **itemSelect**: `string`

#### Defined in

[src/cat.ts:26](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/cat.ts#L26)

***

### maxTheta

> **maxTheta**: `number`

#### Defined in

[src/cat.ts:28](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/cat.ts#L28)

***

### method

> **method**: `string`

#### Defined in

[src/cat.ts:25](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/cat.ts#L25)

***

### minTheta

> **minTheta**: `number`

#### Defined in

[src/cat.ts:27](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/cat.ts#L27)

***

### nStartItems

> **nStartItems**: `number`

#### Defined in

[src/cat.ts:34](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/cat.ts#L34)

***

### prior

> **prior**: `number`[][]

#### Defined in

[src/cat.ts:29](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/cat.ts#L29)

***

### startSelect

> **startSelect**: `string`

#### Defined in

[src/cat.ts:35](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/cat.ts#L35)

## Accessors

### nItems

> `get` **nItems**(): `number`

Return the number of items that have been observed so far.

#### Returns

`number`

#### Defined in

[src/cat.ts:89](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/cat.ts#L89)

***

### resps

> `get` **resps**(): (`0` \| `1`)[]

#### Returns

(`0` \| `1`)[]

#### Defined in

[src/cat.ts:93](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/cat.ts#L93)

***

### seMeasurement

> `get` **seMeasurement**(): `number`

#### Returns

`number`

#### Defined in

[src/cat.ts:82](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/cat.ts#L82)

***

### theta

> `get` **theta**(): `number`

#### Returns

`number`

#### Defined in

[src/cat.ts:78](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/cat.ts#L78)

***

### zetas

> `get` **zetas**(): `Zeta`[]

#### Returns

`Zeta`[]

#### Defined in

[src/cat.ts:97](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/cat.ts#L97)

## Methods

### findNextItem()

> **findNextItem**(`stimuli`, `itemSelect`, `deepCopy`): `object`

find the next available item from an input array of stimuli based on a selection method

remainingStimuli is sorted by fisher information to reduce the computation complexity for future item selection

#### Parameters

• **stimuli**: `Stimulus`[]

an array of stimulus

• **itemSelect**: `string` = `...`

the item selection method

• **deepCopy**: `boolean` = `true`

default deepCopy = true

#### Returns

`object`

##### nextStimulus

> **nextStimulus**: `undefined` \| `Stimulus` = `nextItem`

##### remainingStimuli

> **remainingStimuli**: `Stimulus`[] = `arr`

#### Defined in

[src/cat.ts:203](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/cat.ts#L203)

***

### updateAbilityEstimate()

> **updateAbilityEstimate**(`zeta`, `answer`, `method`): `void`

use previous response patterns and item params to calculate the estimate ability based on a defined method

#### Parameters

• **zeta**: `Zeta` \| `Zeta`[]

last item param

• **answer**: `0` \| `1` \| (`0` \| `1`)[]

last response pattern

• **method**: `string` = `...`

#### Returns

`void`

#### Defined in

[src/cat.ts:134](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/cat.ts#L134)
