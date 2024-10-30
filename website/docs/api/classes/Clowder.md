[**@bdelab/jscat**](../README.md) • **Docs**

***

[@bdelab/jscat](../globals.md) / Clowder

# Class: Clowder

The Clowder class is responsible for managing a collection of Cat instances
along with a corpus of stimuli.  It maintains a list of named Cat instances
and a corpus where each item in the coprpus may have IRT parameters
corresponding to each named Cat. Clowder provides methods for updating the
ability estimates of each of its Cats, and selecting the next item to present
to the participant.

## Constructors

### new Clowder()

> **new Clowder**(`__namedParameters`): [`Clowder`](Clowder.md)

Create a Clowder object.

#### Parameters

• **\_\_namedParameters**: [`ClowderInput`](../interfaces/ClowderInput.md)

#### Returns

[`Clowder`](Clowder.md)

#### Throws

- Throws an error if any item in the corpus has duplicated IRT parameters for any Cat name.

#### Defined in

[src/clowder.ts:61](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/clowder.ts#L61)

## Accessors

### cats

> `get` **cats**(): `Omit`\<`CatMap`\<[`Cat`](Cat.md)\>, `"unvalidated"`\>

The named Cat instances that this Clowder manages.

#### Returns

`Omit`\<`CatMap`\<[`Cat`](Cat.md)\>, `"unvalidated"`\>

#### Defined in

[src/clowder.ts:97](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/clowder.ts#L97)

***

### corpus

> `get` **corpus**(): `MultiZetaStimulus`[]

The corpus that was provided to this Clowder when it was created.

#### Returns

`MultiZetaStimulus`[]

#### Defined in

[src/clowder.ts:104](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/clowder.ts#L104)

***

### earlyStopping

> `get` **earlyStopping**(): `undefined` \| [`EarlyStopping`](EarlyStopping.md)

The early stopping condition in the Clowder configuration.

#### Returns

`undefined` \| [`EarlyStopping`](EarlyStopping.md)

#### Defined in

[src/clowder.ts:160](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/clowder.ts#L160)

***

### nItems

> `get` **nItems**(): `object`

The number of items presented to each Cat instance.

#### Returns

`object`

#### Defined in

[src/clowder.ts:139](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/clowder.ts#L139)

***

### remainingItems

> `get` **remainingItems**(): `MultiZetaStimulus`[]

The subset of the input corpus that this Clowder has not yet "seen".

#### Returns

`MultiZetaStimulus`[]

#### Defined in

[src/clowder.ts:111](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/clowder.ts#L111)

***

### resps

> `get` **resps**(): `object`

The responses received by each Cat instance.

#### Returns

`object`

#### Defined in

[src/clowder.ts:146](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/clowder.ts#L146)

***

### seenItems

> `get` **seenItems**(): `Stimulus`[]

The subset of the input corpus that this Clowder has "seen" so far.

#### Returns

`Stimulus`[]

#### Defined in

[src/clowder.ts:118](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/clowder.ts#L118)

***

### seMeasurement

> `get` **seMeasurement**(): `object`

The standard error of measurement estimates for each Cat instance.

#### Returns

`object`

#### Defined in

[src/clowder.ts:132](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/clowder.ts#L132)

***

### stoppingReason

> `get` **stoppingReason**(): `null` \| `string`

The stopping reason in the Clowder configuration.

#### Returns

`null` \| `string`

#### Defined in

[src/clowder.ts:167](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/clowder.ts#L167)

***

### theta

> `get` **theta**(): `object`

The theta estimates for each Cat instance.

#### Returns

`object`

#### Defined in

[src/clowder.ts:125](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/clowder.ts#L125)

***

### zetas

> `get` **zetas**(): `object`

The zeta (item parameters) received by each Cat instance.

#### Returns

`object`

#### Defined in

[src/clowder.ts:153](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/clowder.ts#L153)

## Methods

### updateAbilityEstimates()

> **updateAbilityEstimates**(`catNames`, `zeta`, `answer`, `method`?): `void`

Updates the ability estimates for the specified Cat instances.

#### Parameters

• **catNames**: `string`[]

The names of the Cat instances to update.

• **zeta**: `Zeta` \| `Zeta`[]

The item parameter(s) (zeta) for the given stimuli.

• **answer**: `0` \| `1` \| (`0` \| `1`)[]

The corresponding answer(s) (0 or 1) for the given stimuli.

• **method?**: `string`

Optional method for updating ability estimates. If none is provided, it will use the default method for each Cat instance.

#### Returns

`void`

#### Throws

If any `catName` is not found among the existing Cat instances.

#### Defined in

[src/clowder.ts:181](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/clowder.ts#L181)

***

### updateCatAndGetNextItem()

> **updateCatAndGetNextItem**(`__namedParameters`): `undefined` \| `Stimulus`

Update the ability estimates for the specified `catsToUpdate` and select the next stimulus for the `catToSelect`.
This function processes previous items and answers, updates internal state, and selects the next stimulus
based on the remaining stimuli and `catToSelect`.

#### Parameters

• **\_\_namedParameters**

• **\_\_namedParameters.answers?**: `0` \| `1` \| (`0` \| `1`)[] = `[]`

• **\_\_namedParameters.catsToUpdate?**: `string` \| `string`[] = `[]`

• **\_\_namedParameters.catToSelect**: `string`

• **\_\_namedParameters.items?**: `MultiZetaStimulus` \| `MultiZetaStimulus`[] = `[]`

• **\_\_namedParameters.itemSelect?**: `string`

• **\_\_namedParameters.method?**: `string`

• **\_\_namedParameters.randomlySelectUnvalidated?**: `boolean` = `false`

• **\_\_namedParameters.returnUndefinedOnExhaustion?**: `boolean` = `true`

#### Returns

`undefined` \| `Stimulus`

- The next stimulus to present, or `undefined` if no further validated stimuli are available.

#### Throws

If `items` and `answers` lengths do not match.

#### Throws

If any `items` are not found in the Clowder's corpora (validated or unvalidated).

The function operates in several steps:
1. Validate:
   a. Validates the `catToSelect` and `catsToUpdate`.
   b. Ensures `items` and `answers` arrays are properly formatted.
2. Update:
   a. Updates the internal list of seen items.
   b. Updates the ability estimates for the `catsToUpdate`.
3. Select:
   a. Selects the next item using `catToSelect`, considering only remaining items that are valid for that cat.
   b. If desired, randomly selects an unvalidated item for catToSelect.

#### Defined in

[src/clowder.ts:219](https://github.com/richford/jsCAT/blob/fb5886c49e617661cab071df7ac93a903c778d41/src/clowder.ts#L219)
