import { FrameEditor } from './components/FrameEditor/FrameEditor';
import * as types from './types';
import * as store from './redux';
const exports = Object.assign(Object.assign(Object.assign({}, types), store), { FrameEditor });
export default exports;
