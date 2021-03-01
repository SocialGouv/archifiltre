import {
  boundNumber,
  curriedFormatPercent,
  formatPercent,
  normalize,
  percent,
  ratio,
} from "./numbers-util";

describe("numbers-util", () => {
  describe("percent", () => {
    describe("with default numbersOfDecimals", () => {
      describe("with a value rounded down", () => {
        it("should return a rounded value", () => {
          expect(percent(1, 3)).toEqual(33);
        });
      });

      describe("with a value rounded up", () => {
        it("should return a rounded value", () => {
          expect(percent(2, 3)).toEqual(67);
        });
      });
    });

    describe("with a set numbersOfDecimals", () => {
      describe("with a value rounded down", () => {
        it("should return a rounded value", () => {
          expect(percent(1, 3, { numbersOfDecimals: 2 })).toEqual(33.33);
        });
      });

      describe("with a value rounded up", () => {
        it("should return a rounded value", () => {
          expect(percent(2, 3, { numbersOfDecimals: 2 })).toEqual(66.67);
        });
      });
    });
  });

  describe("formatPercent", () => {
    it("with default value", () => {
      expect(formatPercent(1 / 3)).toBe(33);
    });

    it("with set number of decimals", () => {
      expect(formatPercent(1 / 3, { numbersOfDecimals: 2 })).toBe(33.33);
    });
  });

  describe("curriedFormatPercent", () => {
    it("with set number of decimals", () => {
      expect(curriedFormatPercent({ numbersOfDecimals: 2 })(1 / 3)).toBe(33.33);
    });
  });

  describe("ratio", () => {
    it("should work with default min value", () => {
      expect(ratio(10, { max: 20 })).toBe(0.5);
    });

    it("should work with set min value", () => {
      expect(ratio(15, { max: 20, min: 10 })).toBe(0.5);
    });
  });

  describe("boundNumber", () => {
    it("should return the value if between bounds", () => {
      expect(boundNumber(0, 10, 5)).toBe(5);
    });

    it("should apply lower bound", () => {
      expect(boundNumber(0, 10, -5)).toBe(0);
    });

    it("should apply upper bound", () => {
      expect(boundNumber(0, 10, 15)).toBe(10);
    });
  });

  describe("normalize", () => {
    it("should return 0 if value is 0", () => {
      expect(normalize(0)).toBe(0);
    });

    it("should return -1 if less than 0", () => {
      expect(normalize(-5)).toBe(-1);
    });

    it("should return 1 when more than 0", () => {
      expect(normalize(15)).toBe(1);
    });
  });
});
