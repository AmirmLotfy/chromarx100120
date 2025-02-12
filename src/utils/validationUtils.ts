
export const validateDataStructure = <T extends Record<string, any>>(
  data: T,
  schema: Record<keyof T, (value: any) => boolean>
): void => {
  for (const [key, validator] of Object.entries(schema)) {
    if (!validator(data[key])) {
      throw new Error(`Invalid ${String(key)} in data structure`);
    }
  }
};

export const isNumber = (value: any): boolean => 
  typeof value === 'number' && !isNaN(value);

export const isPositiveNumber = (value: any): boolean => 
  isNumber(value) && value >= 0;

export const isArray = (value: any): boolean => 
  Array.isArray(value);

export const isNonEmptyArray = (value: any): boolean => 
  isArray(value) && value.length > 0;

export const isString = (value: any): boolean => 
  typeof value === 'string' && value.length > 0;

export const isBoolean = (value: any): boolean => 
  typeof value === 'boolean';

export const isValidDate = (value: any): boolean => 
  value instanceof Date && !isNaN(value.getTime());

export const isValidDateString = (value: any): boolean => 
  isString(value) && !isNaN(Date.parse(value));
