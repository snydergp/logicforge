export class Tree<T> {
  private _root: TreeNode<T>;

  constructor(rootValue: T) {
    this._root = new TreeNode<T>(rootValue);
  }

  setValue(path: string[], value: T) {
    const parent = this.resolveNode(path.slice(0, -1));
    if (parent === undefined) {
      throw new Error(`Attempted to define child for missing parent [${path.join('/')}]`);
    }
    parent.setChild(path[path.length - 1], value);
  }

  getValue(path: string[]) {
    return this.resolveNode(path)?.value;
  }

  hasValue(path: string[]) {
    return this.resolveNode(path) !== undefined;
  }

  private resolveNode(path: string[]): TreeNode<T> | undefined {
    let node = this._root;
    for (let segment of path) {
      node = node.getChild(segment);
      if (node === undefined) {
        break;
      }
    }
    return node;
  }
}

class TreeNode<T> {
  private _value: T;
  private _children: { [key: string]: TreeNode<T> } = {};

  constructor(value: T) {
    this._value = value;
  }

  get value(): T {
    return this._value;
  }

  set value(value: T) {
    this._value = value;
  }

  setChild(name: string, value: T): void {
    this._children[name] = new TreeNode<T>(value);
  }

  getChild(name: string) {
    return this._children[name];
  }

  listChildKeys() {
    return Object.keys(this._children);
  }
}
