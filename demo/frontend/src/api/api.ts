import { EngineSpec, ProcessConfig } from 'logicforge/dist/types';
import axios from 'axios';

const DEFAULT_PATH: string = '';

export interface Api {
  fetchEngineSpec(): Promise<EngineSpec>;

  fetchProcessConfiguration(id: string): Promise<ProcessConfig>;

  saveProcessConfiguration(config: ProcessConfig): Promise<void>;
}

class ApiImpl implements Api {
  async fetchEngineSpec(): Promise<EngineSpec> {
    const response = await axios.get(`/engine/spec`);
    return response.data as EngineSpec;
  }

  async fetchProcessConfiguration(id: string): Promise<ProcessConfig> {
    const response = await axios.get(`/process/${id}`);
    return response.data as ProcessConfig;
  }

  async saveProcessConfiguration(config: ProcessConfig): Promise<void> {
    const path = `/process`;
    return axios.put(path, config).then();
  }
}

export default new ApiImpl();
