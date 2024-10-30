[**@bdelab/jscat**](../README.md) • **Docs**

***

[@bdelab/jscat](../globals.md) / StopAfterNItems

# Class: StopAfterNItems

Class implementing early stopping after a certain number of items.

## Extends

- [`EarlyStopping`](EarlyStopping.md)

## Constructors

### new StopAfterNItems()

> **new StopAfterNItems**(`input`): [`StopAfterNItems`](StopAfterNItems.md)

#### Parameters

• **input**: `StopAfterNItemsInput`

#### Returns

[`StopAfterNItems`](StopAfterNItems.md)

#### Overrides

[`EarlyStopping`](EarlyStopping.md).[`constructor`](EarlyStopping.md#constructors)

#### Defined in

[src/stopping.ts:178](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/stopping.ts#L178)

## Properties

### \_earlyStop

> `protected` **\_earlyStop**: `boolean`

#### Inherited from

[`EarlyStopping`](EarlyStopping.md).[`_earlyStop`](EarlyStopping.md#_earlystop)

#### Defined in

[src/stopping.ts:38](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/stopping.ts#L38)

***

### \_logicalOperation

> `protected` **\_logicalOperation**: `"and"` \| `"or"` \| `"only"`

#### Inherited from

[`EarlyStopping`](EarlyStopping.md).[`_logicalOperation`](EarlyStopping.md#_logicaloperation)

#### Defined in

[src/stopping.ts:41](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/stopping.ts#L41)

***

### \_nItems

> `protected` **\_nItems**: `CatMap`\<`number`\>

#### Inherited from

[`EarlyStopping`](EarlyStopping.md).[`_nItems`](EarlyStopping.md#_nitems)

#### Defined in

[src/stopping.ts:39](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/stopping.ts#L39)

***

### \_requiredItems

> `protected` **\_requiredItems**: `CatMap`\<`number`\>

#### Defined in

[src/stopping.ts:176](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/stopping.ts#L176)

***

### \_seMeasurements

> `protected` **\_seMeasurements**: `CatMap`\<`number`[]\>

#### Inherited from

[`EarlyStopping`](EarlyStopping.md).[`_seMeasurements`](EarlyStopping.md#_semeasurements)

#### Defined in

[src/stopping.ts:40](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/stopping.ts#L40)

## Accessors

### earlyStop

> `get` **earlyStop**(): `boolean`

#### Returns

`boolean`

#### Inherited from

[`EarlyStopping`](EarlyStopping.md).[`earlyStop`](EarlyStopping.md#earlystop)

#### Defined in

[src/stopping.ts:56](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/stopping.ts#L56)

***

### evaluationCats

> `get` **evaluationCats**(): `string`[]

#### Returns

`string`[]

#### Overrides

[`EarlyStopping`](EarlyStopping.md).[`evaluationCats`](EarlyStopping.md#evaluationcats)

#### Defined in

[src/stopping.ts:187](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/stopping.ts#L187)

***

### logicalOperation

> `get` **logicalOperation**(): `"and"` \| `"or"` \| `"only"`

#### Returns

`"and"` \| `"or"` \| `"only"`

#### Inherited from

[`EarlyStopping`](EarlyStopping.md).[`logicalOperation`](EarlyStopping.md#logicaloperation)

#### Defined in

[src/stopping.ts:68](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/stopping.ts#L68)

***

### nItems

> `get` **nItems**(): `CatMap`\<`number`\>

#### Returns

`CatMap`\<`number`\>

#### Inherited from

[`EarlyStopping`](EarlyStopping.md).[`nItems`](EarlyStopping.md#nitems)

#### Defined in

[src/stopping.ts:60](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/stopping.ts#L60)

***

### requiredItems

> `get` **requiredItems**(): `CatMap`\<`number`\>

#### Returns

`CatMap`\<`number`\>

#### Defined in

[src/stopping.ts:183](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/stopping.ts#L183)

***

### seMeasurements

> `get` **seMeasurements**(): `CatMap`\<`number`[]\>

#### Returns

`CatMap`\<`number`[]\>

#### Inherited from

[`EarlyStopping`](EarlyStopping.md).[`seMeasurements`](EarlyStopping.md#semeasurements)

#### Defined in

[src/stopping.ts:64](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/stopping.ts#L64)

## Methods

### \_evaluateStoppingCondition()

> `protected` **\_evaluateStoppingCondition**(`catToEvaluate`): `boolean`

Abstract method to be implemented by subclasses to evaluate a single stopping condition.

#### Parameters

• **catToEvaluate**: `string`

The name of the cat to evaluate for early stopping.

#### Returns

`boolean`

#### Overrides

[`EarlyStopping`](EarlyStopping.md).[`_evaluateStoppingCondition`](EarlyStopping.md#_evaluatestoppingcondition)

#### Defined in

[src/stopping.ts:191](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/stopping.ts#L191)

***

### \_updateCats()

> `protected` **\_updateCats**(`cats`): `void`

Update the internal state of the early stopping strategy based on the provided cats.

#### Parameters

• **cats**: `CatMap`\<[`Cat`](Cat.md)\>

A map of cats to update.

#### Returns

`void`

#### Inherited from

[`EarlyStopping`](EarlyStopping.md).[`_updateCats`](EarlyStopping.md#_updatecats)

#### Defined in

[src/stopping.ts:76](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/stopping.ts#L76)

***

### update()

> **update**(`cats`, `catToSelect`?): `void`

Abstract method to be implemented by subclasses to update the early stopping strategy.

#### Parameters

• **cats**: `CatMap`\<[`Cat`](Cat.md)\>

A map of cats to update.

• **catToSelect?**: `string`

#### Returns

`void`

#### Inherited from

[`EarlyStopping`](EarlyStopping.md).[`update`](EarlyStopping.md#update)

#### Defined in

[src/stopping.ts:99](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/stopping.ts#L99)
