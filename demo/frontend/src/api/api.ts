import { EngineSpec, ProcessConfig } from 'logicforge/dist/types';
import axios from 'axios';

const DEFAULT_PATH: string = '';

export interface Api {
  fetchEngineSpec(): Promise<EngineSpec>;

  fetchProcessConfiguration(): Promise<ProcessConfig>;

  saveProcessConfiguration(config: ProcessConfig): Promise<void>;
}

class ApiImpl implements Api {
  private readonly _rootPath: string;

  constructor(rootPath: string) {
    this._rootPath = rootPath;
  }

  async fetchEngineSpec(): Promise<EngineSpec> {
    const response = await axios.get(`${this._rootPath}/engine/spec`);
    return response.data as EngineSpec;
  }

  async fetchProcessConfiguration(): Promise<ProcessConfig> {
    const response = await axios.get(`${this._rootPath}/process`);
    return response.data as ProcessConfig;
  }

  saveProcessConfiguration(config: ProcessConfig): Promise<void> {
    return Promise.resolve(undefined);
  }
}

export default new ApiImpl(DEFAULT_PATH);
