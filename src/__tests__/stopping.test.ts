import { Cat } from '..';
import { CatMap } from '../type';
import {
  EarlyStopping,
  EarlyStoppingInput,
  StopAfterNItems,
  StopIfSEMeasurementBelowThreshold,
  StopOnSEMeasurementPlateau,
} from '../stopping';
import { toBeBoolean } from 'jest-extended';
expect.extend({ toBeBoolean });

const testInstantiation = (earlyStopping: EarlyStopping, input: EarlyStoppingInput) => {
  expect(earlyStopping.patience).toEqual(input.patience ?? {});
  expect(earlyStopping.tolerance).toEqual(input.tolerance ?? {});
  expect(earlyStopping.requiredItems).toEqual(input.requiredItems ?? {});
  expect(earlyStopping.seMeasurementThreshold).toEqual(input.seMeasurementThreshold ?? {});
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
  let input: EarlyStoppingInput;

  beforeEach(() => {
    input = {
      patience: { cat1: 2, cat2: 3 },
      tolerance: { cat1: 0.01, cat2: 0.02 },
      logicalOperation,
    };
    earlyStopping = new StopOnSEMeasurementPlateau(input);
  });

  it('instantiates with input parameters', () => testInstantiation(earlyStopping, input));

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
  let input: EarlyStoppingInput;

  beforeEach(() => {
    input = {
      requiredItems: { cat1: 2, cat2: 3 },
      logicalOperation,
    };
    earlyStopping = new StopAfterNItems(input);
  });

  it('instantiates with input parameters', () => testInstantiation(earlyStopping, input));

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
          nItems: 1,
          seMeasurement: 0.5,
        } as Cat,
        cat2: {
          nItems: 3,
          seMeasurement: 0.3,
        } as Cat,
      },
      {
        cat1: {
          nItems: 2,
          seMeasurement: 0.5,
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
  let input: EarlyStoppingInput;

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

  it('handles missing input for some cats', () => {
    const input = {
      patience: { cat1: 2 },
      tolerance: { cat2: 0.02 },
      seMeasurementThreshold: { cat3: 0.01 },
      logicalOperation,
    };
    const earlyStopping = new StopIfSEMeasurementBelowThreshold(input);

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
          seMeasurement: 0.01,
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
    ];

    earlyStopping.update(updates[0]);
    expect(earlyStopping.earlyStop).toBe(false);

    earlyStopping.update(updates[1]);
    if (earlyStopping.logicalOperation === 'or') {
      expect(earlyStopping.earlyStop).toBe(true);
    } else {
      expect(earlyStopping.earlyStop).toBe(false);
    }

    earlyStopping.update(updates[2]);
    if (earlyStopping.logicalOperation === 'or') {
      expect(earlyStopping.earlyStop).toBe(true);
    } else {
      expect(earlyStopping.earlyStop).toBe(false);
    }
  });

  it('does not stop when the seMeasurement has not plateaued enough over patience', () => {
    const input = {
      patience: { cat1: 2 },
      tolerance: { cat1: 0.05 },
      logicalOperation,
    };
    const earlyStopping = new StopOnSEMeasurementPlateau(input);

    const updates: CatMap<Cat>[] = [
      {
        cat1: {
          nItems: 1,
          seMeasurement: 0.5,
        } as Cat,
      },
      {
        cat1: {
          nItems: 2,
          seMeasurement: 0.49,
        } as Cat,
      },
      {
        cat1: {
          nItems: 3,
          seMeasurement: 0.48,
        } as Cat,
      },
    ];

    earlyStopping.update(updates[0]);
    expect(earlyStopping.earlyStop).toBe(false);

    earlyStopping.update(updates[1]);
    if (earlyStopping.logicalOperation === 'and') {
      expect(earlyStopping.earlyStop).toBe(true);
    } else {
      expect(earlyStopping.earlyStop).toBe(true);
    }

    earlyStopping.update(updates[2]);
    expect(earlyStopping.earlyStop).toBe(true);
  });

  it('does not stop if required items have not been reached', () => {
    const earlyStopping = new StopAfterNItems({
      requiredItems: { cat1: 5 },
      logicalOperation: 'or',
    });
    const updates: CatMap<Cat>[] = [
      {
        cat1: {
          nItems: 2,
          seMeasurement: 0.5,
        } as Cat,
      },
      {
        cat1: {
          nItems: 4,
          seMeasurement: 0.5,
        } as Cat,
      },
    ];

    earlyStopping.update(updates[0]);
    expect(earlyStopping.earlyStop).toBe(false);

    earlyStopping.update(updates[1]);
    expect(earlyStopping.earlyStop).toBe(false); // still not reached requiredItems
  });
});
