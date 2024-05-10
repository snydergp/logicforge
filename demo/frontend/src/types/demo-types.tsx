export type DemoUseCase = {
  id: string;
  processSpecId: string;
  testPanel: TestPanel;
};

export type TestPanel = {
  type: TestPanelType;
  properties: { [key: string]: any };
};

export enum TestPanelType {
  HTTP_RESPONSE,
  FILTER_RESPONSE,
  SEGMENT_RESPONSE,
}
