import { Cat } from '..';
import { CatMap } from '../type';
import {
  EarlyStopping,
  StopAfterNItems,
  StopAfterNItemsInput,
  StopIfSEMeasurementBelowThreshold,
  StopIfSEMeasurementBelowThresholdInput,
  StopOnSEMeasurementPlateau,
  StopOnSEMeasurementPlateauInput,
} from '../stopping';
import { toBeBoolean } from 'jest-extended';
expect.extend({ toBeBoolean });

/* eslint-disable @typescript-eslint/no-explicit-any */
type Class<T> = new (...args: any[]) => T;

const testLogicalOperationValidation = (
  stoppingClass: Class<StopAfterNItems | StopIfSEMeasurementBelowThreshold | StopOnSEMeasurementPlateau>,
  input: StopAfterNItemsInput | StopIfSEMeasurementBelowThresholdInput | StopOnSEMeasurementPlateauInput,
) => {
  expect(() => new stoppingClass(input)).toThrowError(
    `Invalid logical operation. Expected "and", "or", or "only". Received "${input.logicalOperation}"`,
  );
};

const testInstantiation = (
  earlyStopping: EarlyStopping,
  input: StopAfterNItemsInput | StopIfSEMeasurementBelowThresholdInput | StopOnSEMeasurementPlateauInput,
) => {
  if (earlyStopping instanceof StopAfterNItems) {
    expect(earlyStopping.requiredItems).toEqual((input as StopAfterNItems).requiredItems ?? {});
  }

  if (
    earlyStopping instanceof StopOnSEMeasurementPlateau ||
    earlyStopping instanceof StopIfSEMeasurementBelowThreshold
  ) {
    expect(earlyStopping.patience).toEqual((input as StopOnSEMeasurementPlateauInput).patience ?? {});
    expect(earlyStopping.tolerance).toEqual((input as StopOnSEMeasurementPlateauInput).tolerance ?? {});
  }

  if (earlyStopping instanceof StopIfSEMeasurementBelowThreshold) {
    expect(earlyStopping.seMeasurementThreshold).toEqual(
      (input as StopIfSEMeasurementBelowThresholdInput).seMeasurementThreshold ?? {},
    );
  }

  expect(earlyStopping.logicalOperation).toBe(input.logicalOperation?.toLowerCase() ?? 'or');
  expect(earlyStopping.earlyStop).toBeBoolean();
};

const testInternalState = (earlyStopping: EarlyStopping) => {
  const updates: CatMap<Cat>[] = [
    {
      cat1: {
        nItems: 1,
        seMeasurement: 0.5,
      } as Cat,
      cat2: {
        nItems: 1,
        seMeasurement: 0.3,
      } as Cat,
    },
    {
      cat1: {
        nItems: 2,
        seMeasurement: 0.5,
      } as Cat,
      cat2: {
        nItems: 2,
        seMeasurement: 0.3,
      } as Cat,
    },
  ];

  earlyStopping.update(updates[0]);
  expect(earlyStopping.nItems.cat1).toBe(1);
  expect(earlyStopping.seMeasurements.cat1).toEqual([0.5]);
  expect(earlyStopping.nItems.cat2).toBe(1);
  expect(earlyStopping.seMeasurements.cat2).toEqual([0.3]);

  earlyStopping.update(updates[1]);
  expect(earlyStopping.nItems.cat1).toBe(2);
  expect(earlyStopping.seMeasurements.cat1).toEqual([0.5, 0.5]);
  expect(earlyStopping.nItems.cat2).toBe(2);
  expect(earlyStopping.seMeasurements.cat2).toEqual([0.3, 0.3]);
};

describe.each`
  logicalOperation
  ${'and'}
  ${'or'}
`("StopOnSEMeasurementPlateau (with logicalOperation='$logicalOperation'", ({ logicalOperation }) => {
  let earlyStopping: StopOnSEMeasurementPlateau;
  let input: StopOnSEMeasurementPlateauInput;

  beforeEach(() => {
    input = {
      patience: { cat1: 2, cat2: 3 },
      tolerance: { cat1: 0.01, cat2: 0.02 },
      logicalOperation,
    };
    earlyStopping = new StopOnSEMeasurementPlateau(input);
  });

  it('instantiates with input parameters', () => testInstantiation(earlyStopping, input));
  it('validates input', () =>
    testLogicalOperationValidation(StopOnSEMeasurementPlateau, { ...input, logicalOperation: 'invalid' as 'and' }));
  it('updates internal state when new measurements are added', () => testInternalState(earlyStopping));

  it('stops when the seMeasurement has plateaued', () => {
    const updates: CatMap<Cat>[] = [
      {
        cat1: {
          nItems: 1,
          seMeasurement: 0.5,
        } as Cat,
        cat2: {
          nItems: 1,
          seMeasurement: 0.3,
        } as Cat,
      },
      {
        // cat1 should trigger stopping if logicalOperator === 'or', because
        // seMeasurement plateaued over the patience period of 2 items
        cat1: {
          nItems: 2,
          seMeasurement: 0.5,
        } as Cat,
        cat2: {
          nItems: 2,
          seMeasurement: 0.3,
        } as Cat,
      },
      {
        cat1: {
          nItems: 3,
          seMeasurement: 0.5,
        } as Cat,
        // cat2 should trigger stopping if logicalOperator === 'and', because
        // seMeasurement plateaued over the patience period of 3 items, and the
        // cat1 criterion passed last update
        cat2: {
          nItems: 3,
          seMeasurement: 0.3,
        } as Cat,
      },
    ];

    earlyStopping.update(updates[0]);
    expect(earlyStopping.earlyStop).toBe(false);

    if (earlyStopping.logicalOperation === 'or') {
      earlyStopping.update(updates[1]);
      expect(earlyStopping.earlyStop).toBe(true);
    } else {
      earlyStopping.update(updates[1]);
      expect(earlyStopping.earlyStop).toBe(false);

      earlyStopping.update(updates[2]);
      expect(earlyStopping.earlyStop).toBe(true);
    }
  });

  it('does not stop when the seMeasurement has not plateaued', () => {
    const updates: CatMap<Cat>[] = [
      {
        cat1: {
          nItems: 1,
          seMeasurement: 100,
        } as Cat,
        cat2: {
          nItems: 1,
          seMeasurement: 100,
        } as Cat,
      },
      {
        cat1: {
          nItems: 2,
          seMeasurement: 10,
        } as Cat,
        cat2: {
          nItems: 2,
          seMeasurement: 10,
        } as Cat,
      },
      {
        cat1: {
          nItems: 3,
          seMeasurement: 1,
        } as Cat,
        cat2: {
          nItems: 3,
          seMeasurement: 1,
        } as Cat,
      },
    ];

    earlyStopping.update(updates[0]);
    expect(earlyStopping.earlyStop).toBe(false);

    earlyStopping.update(updates[1]);
    expect(earlyStopping.earlyStop).toBe(false);

    earlyStopping.update(updates[2]);
    expect(earlyStopping.earlyStop).toBe(false);
  });

  it('waits for `patience` items to monitor the seMeasurement plateau', () => {
    const updates: CatMap<Cat>[] = [
      {
        cat1: {
          nItems: 1,
          seMeasurement: 100,
        } as Cat,
        cat2: {
          nItems: 1,
          seMeasurement: 0.3,
        } as Cat,
      },
      {
        cat1: {
          nItems: 2,
          seMeasurement: 10,
        } as Cat,
        cat2: {
          nItems: 2,
          seMeasurement: 0.3,
        } as Cat,
      },
      {
        cat1: {
          nItems: 3,
          seMeasurement: 10,
        } as Cat,
        cat2: {
          nItems: 3,
          seMeasurement: 0.3,
        } as Cat,
      },
    ];

    earlyStopping.update(updates[0]);
    expect(earlyStopping.earlyStop).toBe(false);

    earlyStopping.update(updates[1]);
    expect(earlyStopping.earlyStop).toBe(false);

    earlyStopping.update(updates[2]);
    expect(earlyStopping.earlyStop).toBe(true);
  });

  it('triggers early stopping when within tolerance', () => {
    const updates: CatMap<Cat>[] = [
      {
        cat1: {
          nItems: 1,
          seMeasurement: 10,
        } as Cat,
        cat2: {
          nItems: 1,
          seMeasurement: 0.4,
        } as Cat,
      },
      {
        cat1: {
          nItems: 2,
          seMeasurement: 1,
        } as Cat,
        cat2: {
          nItems: 2,
          seMeasurement: 0.395,
        } as Cat,
      },
      {
        cat1: {
          nItems: 3,
          seMeasurement: 0.99,
        } as Cat,
        cat2: {
          nItems: 3,
          seMeasurement: 0.39,
        } as Cat,
      },
    ];

    earlyStopping.update(updates[0]);
    expect(earlyStopping.earlyStop).toBe(false);

    earlyStopping.update(updates[1]);
    expect(earlyStopping.earlyStop).toBe(false);

    earlyStopping.update(updates[2]);
    expect(earlyStopping.earlyStop).toBe(true);
  });
});

describe.each`
  logicalOperation
  ${'and'}
  ${'or'}
`("StopAfterNItems (with logicalOperation='$logicalOperation'", ({ logicalOperation }) => {
  let earlyStopping: StopAfterNItems;
  let input: StopAfterNItemsInput;

  beforeEach(() => {
    input = {
      requiredItems: { cat1: 2, cat2: 3 },
      logicalOperation,
    };
    earlyStopping = new StopAfterNItems(input);
  });

  it('instantiates with input parameters', () => testInstantiation(earlyStopping, input));
  it('validates input', () =>
    testLogicalOperationValidation(StopAfterNItems, { ...input, logicalOperation: 'invalid' as 'and' }));
  it('updates internal state when new measurements are added', () => testInternalState(earlyStopping));

  it('does not step when it has not seen required items', () => {
    const updates: CatMap<Cat>[] = [
      {
        cat1: {
          nItems: 1,
          seMeasurement: 0.5,
        } as Cat,
        cat2: {
          nItems: 1,
          seMeasurement: 0.3,
        } as Cat,
      },
      {
        cat1: {
          // Do not increment nItems for cat1
          nItems: 1,
          seMeasurement: 0.5,
        } as Cat,
        cat2: {
          nItems: 2,
          seMeasurement: 0.3,
        } as Cat,
      },
      {
        cat1: {
          // Do not increment nItems for cat1
          nItems: 1,
          seMeasurement: 0.5,
        } as Cat,
        cat2: {
          // Do not increment nItems for cat2
          nItems: 2,
          seMeasurement: 0.3,
        } as Cat,
      },
      {
        cat1: {
          // Increment nItems for cat1, but only use this update if
          // logicalOperation is 'and'. Early stopping should still not be
          // triggered.
          nItems: 2,
          seMeasurement: 0.5,
        } as Cat,
        cat2: {
          // Do not increment nItems for cat2
          nItems: 2,
          seMeasurement: 0.3,
        } as Cat,
      },
    ];

    earlyStopping.update(updates[0]);
    expect(earlyStopping.earlyStop).toBe(false);

    earlyStopping.update(updates[1]);
    expect(earlyStopping.earlyStop).toBe(false);

    earlyStopping.update(updates[2]);
    expect(earlyStopping.earlyStop).toBe(false);

    if (earlyStopping.logicalOperation === 'and') {
      earlyStopping.update(updates[3]);
      expect(earlyStopping.earlyStop).toBe(false);
    }
  });

  it('stops when it has seen required items', () => {
    const updates: CatMap<Cat>[] = [
      {
        cat1: {
          nItems: 1,
          seMeasurement: 0.5,
        } as Cat,
        cat2: {
          nItems: 1,
          seMeasurement: 0.3,
        } as Cat,
      },
      {
        cat1: {
          // Do not increment nItems for cat1
          nItems: 1,
          seMeasurement: 0.5,
        } as Cat,
        cat2: {
          nItems: 2,
          seMeasurement: 0.3,
        } as Cat,
      },
      {
        cat1: {
          // Do not increment nItems for cat1
          nItems: 1,
          seMeasurement: 0.5,
        } as Cat,
        cat2: {
          // Cat2 reaches required items
          nItems: 3,
          seMeasurement: 0.3,
        } as Cat,
      },
      {
        cat1: {
          // Cat1 reaches required items
          nItems: 2,
          seMeasurement: 0.5,
        } as Cat,
        cat2: {
          // Cat2 reaches required items
          nItems: 3,
          seMeasurement: 0.3,
        } as Cat,
      },
    ];

    earlyStopping.update(updates[0]);
    expect(earlyStopping.earlyStop).toBe(false);

    earlyStopping.update(updates[1]);
    expect(earlyStopping.earlyStop).toBe(false);

    if (earlyStopping.logicalOperation === 'or') {
      earlyStopping.update(updates[2]);
      expect(earlyStopping.earlyStop).toBe(true);
    } else {
      earlyStopping.update(updates[2]);
      expect(earlyStopping.earlyStop).toBe(false);

      earlyStopping.update(updates[3]);
      expect(earlyStopping.earlyStop).toBe(true);
    }
  });
});

describe('EarlyStopping with logicalOperation "only"', () => {
  let earlyStopping: StopOnSEMeasurementPlateau;
  let input: StopOnSEMeasurementPlateauInput;

  beforeEach(() => {
    input = {
      patience: { cat1: 2, cat2: 3 },
      tolerance: { cat1: 0.01, cat2: 0.02 },
      logicalOperation: 'only',
    };
    earlyStopping = new StopOnSEMeasurementPlateau(input);
  });

  it('throws an error if catToSelect is not provided when logicalOperation is "only"', () => {
    expect(() => {
      earlyStopping.update({ cat1: { nItems: 1, seMeasurement: 0.5 } as any }, undefined);
    }).toThrowError('Must provide a cat to select for "only" stopping condition');
  });
});

describe('EarlyStopping with logicalOperation "only"', () => {
  let earlyStopping: StopOnSEMeasurementPlateau;
  let input: StopOnSEMeasurementPlateauInput;

  beforeEach(() => {
    input = {
      patience: { cat1: 2, cat2: 3 },
      tolerance: { cat1: 0.01, cat2: 0.02 },
      logicalOperation: 'only',
    };
    earlyStopping = new StopOnSEMeasurementPlateau(input);
  });

  it('evaluates the stopping condition when catToSelect is in evaluationCats', () => {
    // Add updates to make sure cat1 is included in evaluationCats and has some measurements
    earlyStopping.update({ cat1: { nItems: 1, seMeasurement: 0.5 } as any }, 'cat1');
    earlyStopping.update({ cat1: { nItems: 2, seMeasurement: 0.5 } as any }, 'cat1');

    // Since 'cat1' is in evaluationCats, _earlyStop should be evaluated based on the stopping condition
    expect(earlyStopping.earlyStop).toBe(true); // Should be true because seMeasurement has plateaued
  });
});
describe('EarlyStopping with logicalOperation "only"', () => {
  let earlyStopping: StopOnSEMeasurementPlateau;
  let input: StopOnSEMeasurementPlateauInput;

  beforeEach(() => {
    input = {
      patience: { cat1: 2, cat2: 3 },
      tolerance: { cat1: 0.01, cat2: 0.02 },
      logicalOperation: 'only',
    };
    earlyStopping = new StopOnSEMeasurementPlateau(input);
  });

  it('sets _earlyStop to false when catToSelect is not in evaluationCats', () => {
    // Use 'cat3', which is not in the patience or tolerance maps (and thus not in evaluationCats)
    earlyStopping.update({ cat3: { nItems: 1, seMeasurement: 0.5 } as any }, 'cat3');

    // Since 'cat3' is not in evaluationCats, _earlyStop should be false
    expect(earlyStopping.earlyStop).toBe(false);
  });
});

describe('StopIfSEMeasurementBelowThreshold with empty patience and tolerance', () => {
  let earlyStopping: StopIfSEMeasurementBelowThreshold;
  let input: StopIfSEMeasurementBelowThresholdInput;

  beforeEach(() => {
    input = {
      seMeasurementThreshold: { cat1: 0.03, cat2: 0.02 },
      logicalOperation: 'only',
    };
    earlyStopping = new StopIfSEMeasurementBelowThreshold(input);
  });

  it('should handle updates correctly even with empty patience and tolerance', () => {
    // Update the state with some measurements for cat2, where seMeasurement is below the threshold
    earlyStopping.update({ cat2: { nItems: 1, seMeasurement: 0.01 } as any }, 'cat2');

    // Since patience defaults to 1 and tolerance defaults to 0, early stopping should be triggered
    expect(earlyStopping.earlyStop).toBe(true);
  });

  it('should not trigger early stopping when seMeasurement does not fall below the threshold', () => {
    // Update the state with some measurements for cat1, where seMeasurement is above the threshold
    earlyStopping.update({ cat1: { nItems: 1, seMeasurement: 0.05 } as any }, 'cat1');

    // Early stopping should not be triggered because the seMeasurement is above the threshold
    expect(earlyStopping.earlyStop).toBe(false);
  });
});

describe('StopIfSEMeasurementBelowThreshold with undefined seMeasurementThreshold for a category', () => {
  let earlyStopping: StopIfSEMeasurementBelowThreshold;
  let input: StopIfSEMeasurementBelowThresholdInput;

  beforeEach(() => {
    input = {
      seMeasurementThreshold: {}, // Empty object, meaning no thresholds are defined
      patience: { cat1: 2 }, // Setting patience to 2 for cat1
      tolerance: { cat1: 0.01 }, // Small tolerance for cat1
      logicalOperation: 'only',
    };
    earlyStopping = new StopIfSEMeasurementBelowThreshold(input);
  });

  it('should use a default seThreshold of 0 when seMeasurementThreshold is not defined for the category', () => {
    // Update the state with measurements for cat1, ensuring to meet the patience requirement
    earlyStopping.update({ cat1: { nItems: 1, seMeasurement: -0.005 } as any }, 'cat1');
    earlyStopping.update({ cat1: { nItems: 2, seMeasurement: -0.01 } as any }, 'cat1');

    // Early stopping should now be triggered because the seMeasurement has been below the default threshold of 0 for the patience period
    expect(earlyStopping.earlyStop).toBe(true);
  });
});

describe('StopOnSEMeasurementPlateau without tolerance provided', () => {
  let earlyStopping: StopOnSEMeasurementPlateau;
  let input: StopOnSEMeasurementPlateauInput;

  beforeEach(() => {
    input = {
      patience: { cat1: 2 },
      // No tolerance is provided, it should default to an empty object
      logicalOperation: 'only',
    };
    earlyStopping = new StopOnSEMeasurementPlateau(input);
  });

  it('should handle updates without triggering early stopping when no tolerance is provided', () => {
    // Update with measurements for cat1 that are not exactly equal, simulating tolerance as undefined
    earlyStopping.update({ cat1: { nItems: 1, seMeasurement: 0.5 } as any }, 'cat1');
    earlyStopping.update({ cat1: { nItems: 2, seMeasurement: 0.55 } as any }, 'cat1');

    // Since tolerance is undefined, early stopping should not be triggered even if seMeasurements are slightly different
    expect(earlyStopping.earlyStop).toBe(false);
  });
});

describe.each`
  logicalOperation
  ${'and'}
  ${'or'}
`("StopIfSEMeasurementBelowThreshold (with logicalOperation='$logicalOperation'", ({ logicalOperation }) => {
  let earlyStopping: StopIfSEMeasurementBelowThreshold;
  let input: StopIfSEMeasurementBelowThresholdInput;

  beforeEach(() => {
    input = {
      patience: { cat1: 1, cat2: 3 },
      tolerance: { cat1: 0.01, cat2: 0.02 },
      seMeasurementThreshold: { cat1: 0.03, cat2: 0.02 },
      logicalOperation,
    };
    earlyStopping = new StopIfSEMeasurementBelowThreshold(input);
  });

  it('instantiates with input parameters', () => testInstantiation(earlyStopping, input));
  it('validates input', () =>
    testLogicalOperationValidation(StopIfSEMeasurementBelowThreshold, {
      ...input,
      logicalOperation: 'invalid' as 'and',
    }));
  it('updates internal state when new measurements are added', () => testInternalState(earlyStopping));

  it('stops when the seMeasurement has fallen below a threshold', () => {
    const updates: CatMap<Cat>[] = [
      {
        cat1: {
          nItems: 1,
          seMeasurement: 0.5,
        } as Cat,
        cat2: {
          nItems: 1,
          seMeasurement: 0.3,
        } as Cat,
      },
      {
        cat1: {
          nItems: 2,
          seMeasurement: 0.02,
        } as Cat,
        cat2: {
          nItems: 2,
          seMeasurement: 0.02,
        } as Cat,
      },
      {
        cat1: {
          nItems: 3,
          seMeasurement: 0.02,
        } as Cat,
        cat2: {
          nItems: 3,
          seMeasurement: 0.02,
        } as Cat,
      },
      {
        cat1: {
          nItems: 4,
          seMeasurement: 0.02,
        } as Cat,
        cat2: {
          nItems: 4,
          seMeasurement: 0.02,
        } as Cat,
      },
    ];

    earlyStopping.update(updates[0]);
    expect(earlyStopping.earlyStop).toBe(false);

    if (earlyStopping.logicalOperation === 'or') {
      earlyStopping.update(updates[1]);
      expect(earlyStopping.earlyStop).toBe(true);
    } else {
      earlyStopping.update(updates[1]);
      expect(earlyStopping.earlyStop).toBe(false);

      earlyStopping.update(updates[2]);
      expect(earlyStopping.earlyStop).toBe(false);

      earlyStopping.update(updates[3]);
      expect(earlyStopping.earlyStop).toBe(true);
    }
  });

  it('does not stop when the seMeasurement is above threshold', () => {
    const updates: CatMap<Cat>[] = [
      {
        cat1: {
          nItems: 1,
          seMeasurement: 0.5,
        } as Cat,
        cat2: {
          nItems: 1,
          seMeasurement: 0.3,
        } as Cat,
      },
      {
        cat1: {
          nItems: 2,
          seMeasurement: 0.1,
        } as Cat,
        cat2: {
          nItems: 2,
          seMeasurement: 0.3,
        } as Cat,
      },
      {
        cat1: {
          nItems: 3,
          seMeasurement: 0.1,
        } as Cat,
        cat2: {
          nItems: 3,
          seMeasurement: 0.3,
        } as Cat,
      },
      {
        cat1: {
          nItems: 4,
          seMeasurement: 0.1,
        } as Cat,
        cat2: {
          nItems: 4,
          seMeasurement: 0.3,
        } as Cat,
      },
    ];

    earlyStopping.update(updates[0]);
    expect(earlyStopping.earlyStop).toBe(false);

    earlyStopping.update(updates[1]);
    expect(earlyStopping.earlyStop).toBe(false);

    earlyStopping.update(updates[2]);
    expect(earlyStopping.earlyStop).toBe(false);

    earlyStopping.update(updates[3]);
    expect(earlyStopping.earlyStop).toBe(false);
  });

  it('waits for `patience` items to monitor the seMeasurement plateau', () => {
    const updates: CatMap<Cat>[] = [
      {
        cat1: {
          nItems: 1,
          seMeasurement: 0.5,
        } as Cat,
        cat2: {
          nItems: 1,
          seMeasurement: 0.3,
        } as Cat,
      },
      {
        cat1: {
          nItems: 2,
          seMeasurement: 0.5,
        } as Cat,
        cat2: {
          nItems: 2,
          seMeasurement: 0.01,
        } as Cat,
      },
      {
        cat1: {
          nItems: 3,
          seMeasurement: 0.5,
        } as Cat,
        cat2: {
          nItems: 3,
          seMeasurement: 0.01,
        } as Cat,
      },
      {
        cat1: {
          nItems: 4,
          seMeasurement: 0.5,
        } as Cat,
        // Cat2 should trigger when logicalOperation is 'or'
        cat2: {
          nItems: 4,
          seMeasurement: 0.01,
        } as Cat,
      },
      {
        // Cat1 should trigger when logicalOperation is 'and'
        // Cat2 criterion was satisfied after last update
        cat1: {
          nItems: 5,
          seMeasurement: 0.01,
        } as Cat,
        cat2: {
          nItems: 5,
          seMeasurement: 0.01,
        } as Cat,
      },
    ];

    earlyStopping.update(updates[0]);
    expect(earlyStopping.earlyStop).toBe(false);

    earlyStopping.update(updates[1]);
    expect(earlyStopping.earlyStop).toBe(false);

    earlyStopping.update(updates[2]);
    expect(earlyStopping.earlyStop).toBe(false);

    if (earlyStopping.logicalOperation === 'or') {
      earlyStopping.update(updates[3]);
      expect(earlyStopping.earlyStop).toBe(true);
    } else {
      earlyStopping.update(updates[3]);
      expect(earlyStopping.earlyStop).toBe(false);

      earlyStopping.update(updates[4]);
      expect(earlyStopping.earlyStop).toBe(true);
    }
  });

  it('triggers early stopping when within tolerance', () => {
    const updates: CatMap<Cat>[] = [
      {
        cat1: {
          nItems: 1,
          seMeasurement: 10,
        } as Cat,
        cat2: {
          nItems: 1,
          seMeasurement: 0.4,
        } as Cat,
      },
      {
        cat1: {
          nItems: 2,
          seMeasurement: 1,
        } as Cat,
        cat2: {
          nItems: 2,
          seMeasurement: 0.02,
        } as Cat,
      },
      {
        cat1: {
          nItems: 3,
          seMeasurement: 0.0001,
        } as Cat,
        cat2: {
          nItems: 3,
          seMeasurement: 0.04,
        } as Cat,
      },
      {
        cat1: {
          nItems: 4,
          seMeasurement: 0.5,
        } as Cat,
        cat2: {
          nItems: 4,
          seMeasurement: 0.01,
        } as Cat,
      },
    ];

    earlyStopping.update(updates[0]);
    expect(earlyStopping.earlyStop).toBe(false);

    earlyStopping.update(updates[1]);
    expect(earlyStopping.earlyStop).toBe(false);

    if (earlyStopping.logicalOperation === 'or') {
      earlyStopping.update(updates[2]);
      expect(earlyStopping.earlyStop).toBe(true);
      earlyStopping.update(updates[3]);
      expect(earlyStopping.earlyStop).toBe(true);
    } else {
      earlyStopping.update(updates[2]);
      expect(earlyStopping.earlyStop).toBe(false);
      earlyStopping.update(updates[3]);
      expect(earlyStopping.earlyStop).toBe(false);
    }
  });
});
