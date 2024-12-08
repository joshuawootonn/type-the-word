'use client'

import Color from 'colorjs.io'
import { useField } from 'formik'
import { ComponentPropsWithoutRef } from 'react'

type Props = Omit<ComponentPropsWithoutRef<'input'>, 'name'> & { name: string }

export function ColorInput(props: Props) {
    const [field, , { setValue }] = useField(props.name)
    return (
        <>
            <div className="group relative z-0 h-8 w-8">
                <div className="svg-outline-override absolute -z-10 hidden group-focus-within:block" />
                <input
                    {...props}
                    {...field}
                    type="color"
                    className="border-2 border-primary outline-none"
                    value={new Color(`oklch(${field.value})`)
                        .to('srgb')
                        .toString({
                            format: 'hex',
                            collapse: false,
                        })}
                    onChange={e => {
                        const color = new Color(e.currentTarget.value).to(
                            'oklch',
                        )
                        const colorString = color
                            .toString({ precision: 4 })
                            .replace(')', '')
                            .replace('oklch(', '')
                        document.documentElement.style.setProperty(
                            `--color-${field.name}`,
                            colorString,
                        )

                        void setValue(colorString)
                    }}
                />
            </div>
            <style jsx>{`
                input[type='color'] {
                    -webkit-appearance: none;
                    width: 32px;
                    height: 32px;
                }
                input[type='color']::-webkit-color-swatch-wrapper {
                    padding: 0;
                }
                input[type='color']::-webkit-color-swatch {
                    border: none;
                }
            `}</style>
        </>
    )
}
