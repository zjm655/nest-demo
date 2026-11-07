import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
export function MaxByteLength(max: number, options?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'maxByteLength',
      target: object.constructor,
      propertyName,
      constraints: [max],
      options,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const [limit] = args.constraints as number[];
          return (
            typeof value === 'string' &&
            Buffer.byteLength(value, 'utf8') <= limit
          );
        },
      },
    });
  };
}
