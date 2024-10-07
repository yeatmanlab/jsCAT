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
    `Invalid logical operation. Expected "and" or "or". Received "${input.logicalOperation}"`,
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
