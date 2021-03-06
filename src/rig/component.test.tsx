import { setupShallowTest } from '../tests/enzyme-util/shallow';
import { createViewsForTest, createExtensionForTest, createExtensionManifestForTest } from '../tests/constants/extension';
import { mockFetchForUserInfo } from '../tests/mocks';
import { NavItem } from '../constants/nav-items';
import { RigComponent } from './component';
import { ExtensionAnchors } from '../constants/extension-types';
import { ViewerTypes } from '../constants/viewer-types';
import { RigExtensionView } from '../core/models/rig';
import { ExtensionViewDialogState } from '../extension-view-dialog';
import { ExtensionAnchor, ExtensionViewType } from '../constants/extension-coordinator';

let globalAny = global as any;

const setupShallow = setupShallowTest(RigComponent, () => ({
  session: { displayName: 'test', login: 'test', id: 'test', profileImageUrl: 'test.png', authToken: 'test' },
  saveManifest: jest.fn(),
  userLogin: jest.fn()
}));

describe('<RigComponent />', () => {
  function setupViewsForTest(numViews: number) {
    const testViews = createViewsForTest(numViews, ExtensionAnchors[ExtensionAnchor.Panel], ViewerTypes.LoggedOut);
    localStorage.setItem('extensionViews', JSON.stringify(testViews));
  };

  function setupComponentViewsForTest(numViews: number) {
    const testViews = createViewsForTest(numViews, ExtensionAnchors[ExtensionAnchor.Component], ViewerTypes.LoggedOut);
    localStorage.setItem('extensionViews', JSON.stringify(testViews));
  };

  it('renders correctly', () => {
    const { wrapper } = setupShallow();
    expect(wrapper).toMatchSnapshot();
  });

  it('gets extension views from local storage correctly when not in local storage', () => {
    const { wrapper } = setupShallow();
    const instance = wrapper.instance() as RigComponent;
    expect(instance.state.extensionViews).toEqual([]);
  });

  it('renders extension view correctly', () => {
    setupViewsForTest(1);
    const { wrapper } = setupShallow();
    expect(wrapper).toMatchSnapshot();
    expect((wrapper.find('ExtensionViewContainer') as any).props().extensionViews).toHaveLength(1);
  });

  it('gets extension views from local storage correctly', () => {
    setupViewsForTest(1);
    const testViews = createViewsForTest(1, ExtensionAnchors[ExtensionAnchor.Panel], ViewerTypes.LoggedOut);
    const { wrapper } = setupShallow();
    const instance = wrapper.instance() as RigComponent;
    expect(instance.state.extensionViews).toEqual(testViews);
  });

  it('deletes extension view correctly', () => {
    setupViewsForTest(1);
    const { wrapper } = setupShallow();
    const instance = wrapper.instance() as RigComponent;
    expect((wrapper.find('ExtensionViewContainer') as any).props().extensionViews).toHaveLength(1);

    instance.deleteExtensionView('1');
    wrapper.update();
    expect((wrapper.find('ExtensionViewContainer') as any).props().extensionViews).toHaveLength(0);
  });

  it('toggles state when edit dialog is opened/closed', () => {
    setupComponentViewsForTest(1);
    const { wrapper } = setupShallow();
    const instance = wrapper.instance() as RigComponent;

    instance.openEditViewHandler('1');
    expect(instance.state.showingEditView).toBe(true);
    expect(instance.state.idToEdit).toBe('1');

    instance.closeEditViewHandler();
    expect(instance.state.showingEditView).toBe(false);
    expect(instance.state.idToEdit).toBe('0');
  });

  it('edit changes the view and sets them correctly', () => {
    setupComponentViewsForTest(1);
    const { wrapper } = setupShallow();
    const instance = wrapper.instance() as RigComponent;

    instance.openEditViewHandler('1');
    expect(instance.state.showingEditView).toBe(true);
    expect(instance.state.idToEdit).toBe('1');

    instance.editViewHandler({ x: 25, y: 25 });

    const views = instance.state.extensionViews;
    const editedView = views.filter((element: RigExtensionView) => element.id === '1');
    expect(editedView[0].x).toEqual(25);
    expect(editedView[0].y).toEqual(25);
    expect(instance.state.showingEditView).toBe(false);
    expect(instance.state.idToEdit).toBe('0');
  });

  it('correctly toggles state when configuration dialog is opened/closed', () => {
    setupViewsForTest(1);
    const { wrapper } = setupShallow();
    const instance = wrapper.instance() as RigComponent;

    instance.openConfigurationsHandler();
    expect(instance.state.showingConfigurations).toBe(true);

    instance.closeConfigurationsHandler();
    expect(instance.state.showingConfigurations).toBe(false);
  });

  it('correctly toggles state when create extension view is opened/closed', () => {
    setupViewsForTest(1);
    const { wrapper } = setupShallow();
    const instance = wrapper.instance() as RigComponent;
    instance.onConfigurationSuccess(createExtensionManifestForTest());

    instance.openExtensionViewHandler();
    expect(instance.state.showingExtensionsView).toBe(true);

    instance.closeExtensionViewDialog();
    expect(instance.state.showingExtensionsView).toBe(false);
  });

  it('correctly sets state when viewHandler is invoked', () => {
    setupViewsForTest(1);
    const { wrapper } = setupShallow();
    wrapper.setState({ manifest: createExtensionManifestForTest() });

    const instance = wrapper.instance() as RigComponent;
    instance.viewerHandler();
    expect(instance.state.selectedView).toBe(NavItem.ExtensionViews);
  });

  it('gets the correct views when getExtensionViews invoked', () => {
    const testViews = createViewsForTest(1, ExtensionAnchors[ExtensionAnchor.Panel], ViewerTypes.LoggedOut);
    setupViewsForTest(1);
    const { wrapper } = setupShallow();
    const instance = wrapper.instance() as RigComponent;

    expect(instance.state.extensionViews).toEqual(testViews);
  });

  it('sets views in local storage correctly when pushExtensionViews invoked', () => {
    const testViews = createViewsForTest(1, ExtensionAnchors[ExtensionAnchor.Panel], ViewerTypes.LoggedOut);
    setupViewsForTest(1);
    const { wrapper } = setupShallow();
    const instance = wrapper.instance() as RigComponent;

    expect(instance.state.extensionViews).toEqual(testViews);

    instance.state.extensionViews.push(createViewsForTest(1, ExtensionAnchors[ExtensionAnchor.Panel], ViewerTypes.LoggedOut)[0] as RigExtensionView);
    instance.pushExtensionViews(instance.state.extensionViews);
  });

  it('sets state correctly when onConfigurationSuccess invoked', () => {
    const { wrapper } = setupShallow();
    const fakeManifest = createExtensionManifestForTest();
    const instance = wrapper.instance() as RigComponent;

    instance.onConfigurationSuccess(fakeManifest);
    expect(wrapper.instance().state.manifest).toBe(fakeManifest);
  });

  it('sets error state correctly when onConfigurationError invoked', () => {
    const { wrapper } = setupShallow();
    const testError = new Error('test error');
    const instance = wrapper.instance() as RigComponent;

    instance.onConfigurationError(testError);
    expect(wrapper.instance().state.error).toBe(testError.message +'  Please verify EXT_CLIENT_ID, EXT_SECRET, and EXT_VERSION.');
  });

  describe('gets frame size from dialog ref correctly', () => {
    it('returns correct data for mobile ', () => {
      const { wrapper } = setupShallow();
      const testDialogState = {
        width: 0,
        height: 0,
        frameSize: 'iPhone X (375x822)',
        extensionViewType: ExtensionViewType.Mobile
      } as ExtensionViewDialogState;
      const expectedMobileFrameSize = {
        width: 375,
        height: 822,
      };
      const instance = wrapper.instance() as RigComponent;

      let frameSize = instance.getFrameSizeFromDialog(testDialogState);
      expect(frameSize).toEqual(expectedMobileFrameSize);
    });

    it('returns correct data for other types', () => {
      const { wrapper } = setupShallow();
      const overlayTestDialogState = {
        width: 0,
        height: 0,
        frameSize: '640x480',
        extensionViewType: ExtensionViewType.Overlay
      } as ExtensionViewDialogState;
      const expectedOverlayFrameSize = {
        width: 640,
        height: 480,
      };
      const instance = wrapper.instance() as RigComponent;
      const frameSize = instance.getFrameSizeFromDialog(overlayTestDialogState);
      expect(frameSize).toEqual(expectedOverlayFrameSize);
    });

    it('returns correct data for custom size', () => {
      const { wrapper } = setupShallow();
      const overlayTestDialogState = {
        width: 100,
        height: 100,
        frameSize: 'Custom',
        extensionViewType: ExtensionViewType.Overlay
      } as ExtensionViewDialogState;
      const expectedOverlayFrameSize = {
        width: 100,
        height: 100,
      };
      const instance = wrapper.instance() as RigComponent;
      const frameSize = instance.getFrameSizeFromDialog(overlayTestDialogState);
      expect(frameSize).toEqual(expectedOverlayFrameSize);
    });

    it('correctly fetches user info if login not in localStorage', () => {
      globalAny.fetch = jest.fn().mockImplementation(mockFetchForUserInfo);
      globalAny.window.location.hash = 'access_token=test&';

      setupShallow();
      expect(globalAny.fetch).toHaveBeenCalled();
    });
  });
});
