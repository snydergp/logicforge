import { EngineSpec, ProcessConfig } from "logicforge/dist/types";
import axios from "axios";

const DEFAULT_PATH: string = "http://localhost";

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

  fetchEngineSpec(): Promise<EngineSpec> {
    return axios.get(`${this._rootPath}/engine/spec`);
  }

  fetchProcessConfiguration(): Promise<ProcessConfig> {
    return axios.get(`${this._rootPath}/process`);
  }

  saveProcessConfiguration(config: ProcessConfig): Promise<void> {
    return Promise.resolve(undefined);
  }
}

export default new ApiImpl(DEFAULT_PATH);
