[**@bdelab/jscat**](../README.md) • **Docs**

***

[@bdelab/jscat](../globals.md) / EarlyStopping

# Class: `abstract` EarlyStopping

Abstract class for early stopping strategies.

## Extended by

- [`StopAfterNItems`](StopAfterNItems.md)
- [`StopOnSEMeasurementPlateau`](StopOnSEMeasurementPlateau.md)
- [`StopIfSEMeasurementBelowThreshold`](StopIfSEMeasurementBelowThreshold.md)

## Constructors

### new EarlyStopping()

> **new EarlyStopping**(`__namedParameters`): [`EarlyStopping`](EarlyStopping.md)

#### Parameters

• **\_\_namedParameters**: `EarlyStoppingInput`

#### Returns

[`EarlyStopping`](EarlyStopping.md)

#### Defined in

[src/stopping.ts:43](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/stopping.ts#L43)

## Properties

### \_earlyStop

> `protected` **\_earlyStop**: `boolean`

#### Defined in

[src/stopping.ts:38](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/stopping.ts#L38)

***

### \_logicalOperation

> `protected` **\_logicalOperation**: `"and"` \| `"or"` \| `"only"`

#### Defined in

[src/stopping.ts:41](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/stopping.ts#L41)

***

### \_nItems

> `protected` **\_nItems**: `CatMap`\<`number`\>

#### Defined in

[src/stopping.ts:39](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/stopping.ts#L39)

***

### \_seMeasurements

> `protected` **\_seMeasurements**: `CatMap`\<`number`[]\>

#### Defined in

[src/stopping.ts:40](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/stopping.ts#L40)

## Accessors

### earlyStop

> `get` **earlyStop**(): `boolean`

#### Returns

`boolean`

#### Defined in

[src/stopping.ts:56](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/stopping.ts#L56)

***

### evaluationCats

> `get` `abstract` **evaluationCats**(): `string`[]

#### Returns

`string`[]

#### Defined in

[src/stopping.ts:54](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/stopping.ts#L54)

***

### logicalOperation

> `get` **logicalOperation**(): `"and"` \| `"or"` \| `"only"`

#### Returns

`"and"` \| `"or"` \| `"only"`

#### Defined in

[src/stopping.ts:68](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/stopping.ts#L68)

***

### nItems

> `get` **nItems**(): `CatMap`\<`number`\>

#### Returns

`CatMap`\<`number`\>

#### Defined in

[src/stopping.ts:60](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/stopping.ts#L60)

***

### seMeasurements

> `get` **seMeasurements**(): `CatMap`\<`number`[]\>

#### Returns

`CatMap`\<`number`[]\>

#### Defined in

[src/stopping.ts:64](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/stopping.ts#L64)

## Methods

### \_evaluateStoppingCondition()

> `abstract` `protected` **\_evaluateStoppingCondition**(`catToEvaluate`): `boolean`

Abstract method to be implemented by subclasses to evaluate a single stopping condition.

#### Parameters

• **catToEvaluate**: `string`

The name of the cat to evaluate for early stopping.

#### Returns

`boolean`

#### Defined in

[src/stopping.ts:93](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/stopping.ts#L93)

***

### \_updateCats()

> `protected` **\_updateCats**(`cats`): `void`

Update the internal state of the early stopping strategy based on the provided cats.

#### Parameters

• **cats**: `CatMap`\<[`Cat`](Cat.md)\>

A map of cats to update.

#### Returns

`void`

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

#### Defined in

[src/stopping.ts:99](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/stopping.ts#L99)
