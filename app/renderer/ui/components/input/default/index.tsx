import * as React from "react"

import { Input } from "antd"

export interface Iprops {
  className?: string
  type?: string
  name?: string
  value?: any
  onChange?: React.ChangeEventHandler
  onBlur?: React.ChangeEventHandler
  onKeyUp?: React.KeyboardEventHandler
}

/**
 * Default input UI component
 *
 * @export
 * @class DefaultInput
 * @extends {React.Component<Iprops>}
 */

export default class DefaultInput extends React.Component<Iprops> {
  // tslint:disable-next-line: completed-docs
  public render() {
    return (
      <Input
        className={this.props.className}
        type={this.props.type}
        name={this.props.name}
        value={this.props.value}
        onChange={this.props.onChange}
        onBlur={this.props.onBlur}
        onKeyUp={this.props.onKeyUp}
      />
    )
  }
}