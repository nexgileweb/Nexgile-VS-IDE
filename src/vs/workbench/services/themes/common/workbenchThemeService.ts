/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { refineServiceDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { Event } from '../../../../base/common/event.js';
import { Color } from '../../../../base/common/color.js';
import { IColorTheme, IThemeService, IFileIconTheme, IProductIconTheme } from '../../../../platform/theme/common/themeService.js';
import { ConfigurationTarget } from '../../../../platform/configuration/common/configuration.js';
import { isBoolean, isString } from '../../../../base/common/types.js';
import { IconContribution, IconDefinition } from '../../../../platform/theme/common/iconRegistry.js';
import { ColorScheme, ThemeTypeSelector } from '../../../../platform/theme/common/theme.js';
import product from '../../../../platform/product/common/product.js';

export const IWorkbenchThemeService = refineServiceDecorator<IThemeService, IWorkbenchThemeService>(IThemeService);

export const THEME_SCOPE_OPEN_PAREN = '[';
export const THEME_SCOPE_CLOSE_PAREN = ']';
export const THEME_SCOPE_WILDCARD = '*';

export const themeScopeRegex = /\[(.+?)\]/g;

export enum ThemeSettings {
	COLOR_THEME = 'workbench.colorTheme',
	FILE_ICON_THEME = 'workbench.iconTheme',
	PRODUCT_ICON_THEME = 'workbench.productIconTheme',
	COLOR_CUSTOMIZATIONS = 'workbench.colorCustomizations',
	TOKEN_COLOR_CUSTOMIZATIONS = 'editor.tokenColorCustomizations',
	SEMANTIC_TOKEN_COLOR_CUSTOMIZATIONS = 'editor.semanticTokenColorCustomizations',

	PREFERRED_DARK_THEME = 'workbench.preferredDarkColorTheme',
	PREFERRED_LIGHT_THEME = 'workbench.preferredLightColorTheme',
	PREFERRED_HC_DARK_THEME = 'workbench.preferredHighContrastColorTheme', /* id kept for compatibility reasons */
	PREFERRED_HC_LIGHT_THEME = 'workbench.preferredHighContrastLightColorTheme',
	DETECT_COLOR_SCHEME = 'window.autoDetectColorScheme',
	DETECT_HC = 'window.autoDetectHighContrast',

	SYSTEM_COLOR_THEME = 'window.systemColorTheme'
}

const isOSS = !product.quality;

export namespace ThemeSettingDefaults {
	export const COLOR_THEME_DARK = 'Nexgile Dark Enterprise';
	export const COLOR_THEME_LIGHT = isOSS ? 'Experimental Light' : 'Default Light Modern';
	export const COLOR_THEME_HC_DARK = 'Default High Contrast';
	export const COLOR_THEME_HC_LIGHT = 'Default High Contrast Light';

	export const COLOR_THEME_DARK_OLD = 'Default Dark+';
	export const COLOR_THEME_LIGHT_OLD = 'Default Light+';

	export const FILE_ICON_THEME = 'vs-seti';
	export const PRODUCT_ICON_THEME = 'Default';
}

export const COLOR_THEME_DARK_INITIAL_COLORS = {
	'actionBar.toggledBackground': '#1e293b',
	'activityBar.activeBorder': '#60a5fa',
	'activityBar.background': '#060a12',
	'activityBar.border': '#1e293b',
	'activityBar.foreground': '#e2e8f0',
	'activityBar.inactiveForeground': '#475569',
	'activityBarBadge.background': '#60a5fa',
	'activityBarBadge.foreground': '#0a0e1a',
	'badge.background': '#60a5fa',
	'badge.foreground': '#0a0e1a',
	'button.background': '#60a5fa',
	'button.border': '#FFFFFF12',
	'button.foreground': '#0a0e1a',
	'button.hoverBackground': '#3b82f6',
	'button.secondaryBackground': '#1e293b',
	'button.secondaryForeground': '#e2e8f0',
	'button.secondaryHoverBackground': '#334155',
	'chat.slashCommandBackground': '#1e3a5f66',
	'chat.slashCommandForeground': '#60a5fa',
	'chat.editedFileForeground': '#fbbf24',
	'checkbox.background': '#0c1122',
	'checkbox.border': '#1e293b',
	'debugToolBar.background': '#0c1122',
	'descriptionForeground': '#94a3b8',
	'dropdown.background': '#0c1122',
	'dropdown.border': '#1e293b',
	'dropdown.foreground': '#e2e8f0',
	'dropdown.listBackground': '#0c1122',
	'editor.background': '#0a0e1a',
	'editor.findMatchBackground': '#fbbf2440',
	'editor.foreground': '#e2e8f0',
	'editor.inactiveSelectionBackground': '#1e3a5f40',
	'editor.selectionHighlightBackground': '#1e3a5f40',
	'editorGroup.border': '#1e293b',
	'editorGroupHeader.tabsBackground': '#080c16',
	'editorGroupHeader.tabsBorder': '#1e293b',
	'editorGutter.addedBackground': '#4ade8080',
	'editorGutter.deletedBackground': '#f8717180',
	'editorGutter.modifiedBackground': '#60a5fa80',
	'editorIndentGuide.activeBackground1': '#334155',
	'editorIndentGuide.background1': '#1e293b',
	'editorLineNumber.activeForeground': '#94a3b8',
	'editorLineNumber.foreground': '#334155',
	'editorOverviewRuler.border': '#0a0e1a',
	'editorWidget.background': '#0c1122',
	'errorForeground': '#f87171',
	'focusBorder': '#60a5fa80',
	'foreground': '#e2e8f0',
	'icon.foreground': '#94a3b8',
	'input.background': '#0c1122',
	'input.border': '#1e293b',
	'input.foreground': '#e2e8f0',
	'input.placeholderForeground': '#475569',
	'inputOption.activeBackground': '#60a5fa20',
	'inputOption.activeBorder': '#60a5fa',
	'keybindingLabel.foreground': '#e2e8f0',
	'list.activeSelectionIconForeground': '#e2e8f0',
	'list.dropBackground': '#60a5fa20',
	'menu.background': '#0c1122',
	'menu.border': '#1e293b',
	'menu.foreground': '#e2e8f0',
	'menu.selectionBackground': '#1e3a5f',
	'menu.separatorBackground': '#1e293b',
	'notificationCenterHeader.background': '#0a1628',
	'notificationCenterHeader.foreground': '#e2e8f0',
	'notifications.background': '#0c1122',
	'notifications.border': '#1e293b',
	'notifications.foreground': '#e2e8f0',
	'panel.background': '#080c16',
	'panel.border': '#1e293b',
	'panelInput.border': '#1e293b',
	'panelTitle.activeBorder': '#60a5fa',
	'panelTitle.activeForeground': '#e2e8f0',
	'panelTitle.inactiveForeground': '#64748b',
	'peekViewEditor.background': '#0c1122',
	'peekViewEditor.matchHighlightBackground': '#fbbf2440',
	'peekViewResult.background': '#080c16',
	'peekViewResult.matchHighlightBackground': '#fbbf2440',
	'pickerGroup.border': '#1e293b',
	'ports.iconRunningProcessForeground': '#4ade80',
	'progressBar.background': '#60a5fa',
	'quickInput.background': '#0c1122',
	'quickInput.foreground': '#e2e8f0',
	'settings.dropdownBackground': '#0c1122',
	'settings.dropdownBorder': '#1e293b',
	'settings.headerForeground': '#e2e8f0',
	'settings.modifiedItemIndicator': '#60a5fa',
	'sideBar.background': '#080c16',
	'sideBar.border': '#1e293b',
	'sideBar.foreground': '#94a3b8',
	'sideBarSectionHeader.background': '#060a12',
	'sideBarSectionHeader.border': '#1e293b',
	'sideBarSectionHeader.foreground': '#e2e8f0',
	'sideBarTitle.foreground': '#e2e8f0',
	'statusBar.background': '#0a1628',
	'statusBar.border': '#1e293b',
	'statusBar.debuggingBackground': '#f87171',
	'statusBar.debuggingForeground': '#0a0e1a',
	'statusBar.focusBorder': '#60a5fa',
	'statusBar.foreground': '#94a3b8',
	'statusBar.noFolderBackground': '#0a1628',
	'statusBarItem.focusBorder': '#60a5fa',
	'statusBarItem.prominentBackground': '#60a5fa20',
	'statusBarItem.remoteBackground': '#60a5fa',
	'statusBarItem.remoteForeground': '#0a0e1a',
	'tab.activeBackground': '#0a0e1a',
	'tab.activeBorder': '#0a0e1a',
	'tab.activeBorderTop': '#60a5fa',
	'tab.activeForeground': '#e2e8f0',
	'tab.border': '#0a0e1a',
	'tab.hoverBackground': '#0f1729',
	'tab.inactiveBackground': '#080c16',
	'tab.inactiveForeground': '#64748b',
	'tab.lastPinnedBorder': '#1e293b',
	'tab.selectedBackground': '#0a0e1a',
	'tab.selectedBorderTop': '#60a5fa',
	'tab.selectedForeground': '#e2e8f0a0',
	'tab.unfocusedActiveBorder': '#0a0e1a',
	'tab.unfocusedActiveBorderTop': '#1e293b',
	'tab.unfocusedHoverBackground': '#0f1729',
	'terminal.foreground': '#e2e8f0',
	'terminal.inactiveSelectionBackground': '#1e3a5f40',
	'terminal.tab.activeBorder': '#60a5fa',
	'textBlockQuote.background': '#0c1122',
	'textBlockQuote.border': '#1e293b',
	'textCodeBlock.background': '#0c1122',
	'textLink.activeForeground': '#93c5fd',
	'textLink.foreground': '#60a5fa',
	'textPreformat.background': '#1e293b',
	'textPreformat.foreground': '#2dd4bf',
	'textSeparator.foreground': '#1e293b',
	'titleBar.activeBackground': '#060a12',
	'titleBar.activeForeground': '#e2e8f0',
	'titleBar.border': '#1e293b',
	'titleBar.inactiveBackground': '#060a12',
	'titleBar.inactiveForeground': '#64748b',
	'welcomePage.progress.foreground': '#60a5fa',
	'welcomePage.tileBackground': '#0c1122',
	'widget.border': '#1e293b'
};

export const COLOR_THEME_LIGHT_INITIAL_COLORS = {
	'actionBar.toggledBackground': '#dddddd',
	'activityBar.activeBorder': '#005FB8',
	'activityBar.background': '#F8F8F8',
	'activityBar.border': '#E5E5E5',
	'activityBar.foreground': '#1F1F1F',
	'activityBar.inactiveForeground': '#616161',
	'activityBarBadge.background': '#005FB8',
	'activityBarBadge.foreground': '#FFFFFF',
	'badge.background': '#CCCCCC',
	'badge.foreground': '#3B3B3B',
	'button.background': '#005FB8',
	'button.border': '#0000001a',
	'button.foreground': '#FFFFFF',
	'button.hoverBackground': '#0258A8',
	'button.secondaryBackground': '#E5E5E5',
	'button.secondaryForeground': '#3B3B3B',
	'button.secondaryHoverBackground': '#CCCCCC',
	'chat.slashCommandBackground': '#ADCEFF7A',
	'chat.slashCommandForeground': '#26569E',
	'chat.editedFileForeground': '#895503',
	'checkbox.background': '#F8F8F8',
	'checkbox.border': '#CECECE',
	'descriptionForeground': '#3B3B3B',
	'diffEditor.unchangedRegionBackground': '#f8f8f8',
	'dropdown.background': '#FFFFFF',
	'dropdown.border': '#CECECE',
	'dropdown.foreground': '#3B3B3B',
	'dropdown.listBackground': '#FFFFFF',
	'editor.background': '#FFFFFF',
	'editor.foreground': '#3B3B3B',
	'editor.inactiveSelectionBackground': '#E5EBF1',
	'editor.selectionHighlightBackground': '#ADD6FF80',
	'editorGroup.border': '#E5E5E5',
	'editorGroupHeader.tabsBackground': '#F8F8F8',
	'editorGroupHeader.tabsBorder': '#E5E5E5',
	'editorGutter.addedBackground': '#2EA043',
	'editorGutter.deletedBackground': '#F85149',
	'editorGutter.modifiedBackground': '#005FB8',
	'editorIndentGuide.activeBackground1': '#939393',
	'editorIndentGuide.background1': '#D3D3D3',
	'editorLineNumber.activeForeground': '#171184',
	'editorLineNumber.foreground': '#6E7681',
	'editorOverviewRuler.border': '#E5E5E5',
	'editorSuggestWidget.background': '#F8F8F8',
	'editorWidget.background': '#F8F8F8',
	'errorForeground': '#F85149',
	'focusBorder': '#005FB8',
	'foreground': '#3B3B3B',
	'icon.foreground': '#3B3B3B',
	'input.background': '#FFFFFF',
	'input.border': '#CECECE',
	'input.foreground': '#3B3B3B',
	'input.placeholderForeground': '#767676',
	'inputOption.activeBackground': '#BED6ED',
	'inputOption.activeBorder': '#005FB8',
	'inputOption.activeForeground': '#000000',
	'keybindingLabel.foreground': '#3B3B3B',
	'list.activeSelectionBackground': '#E8E8E8',
	'list.activeSelectionForeground': '#000000',
	'list.activeSelectionIconForeground': '#000000',
	'list.focusAndSelectionOutline': '#005FB8',
	'list.hoverBackground': '#F2F2F2',
	'menu.border': '#CECECE',
	'menu.selectionBackground': '#005FB8',
	'menu.selectionForeground': '#ffffff',
	'notebook.cellBorderColor': '#E5E5E5',
	'notebook.selectedCellBackground': '#C8DDF150',
	'notificationCenterHeader.background': '#FFFFFF',
	'notificationCenterHeader.foreground': '#3B3B3B',
	'notifications.background': '#FFFFFF',
	'notifications.border': '#E5E5E5',
	'notifications.foreground': '#3B3B3B',
	'panel.background': '#F8F8F8',
	'panel.border': '#E5E5E5',
	'panelInput.border': '#E5E5E5',
	'panelTitle.activeBorder': '#005FB8',
	'panelTitle.activeForeground': '#3B3B3B',
	'panelTitle.inactiveForeground': '#3B3B3B',
	'peekViewEditor.matchHighlightBackground': '#BB800966',
	'peekViewResult.background': '#FFFFFF',
	'peekViewResult.matchHighlightBackground': '#BB800966',
	'pickerGroup.border': '#E5E5E5',
	'pickerGroup.foreground': '#8B949E',
	'ports.iconRunningProcessForeground': '#369432',
	'progressBar.background': '#005FB8',
	'quickInput.background': '#F8F8F8',
	'quickInput.foreground': '#3B3B3B',
	'searchEditor.textInputBorder': '#CECECE',
	'settings.dropdownBackground': '#FFFFFF',
	'settings.dropdownBorder': '#CECECE',
	'settings.headerForeground': '#1F1F1F',
	'settings.modifiedItemIndicator': '#BB800966',
	'settings.numberInputBorder': '#CECECE',
	'settings.textInputBorder': '#CECECE',
	'sideBar.background': '#F8F8F8',
	'sideBar.border': '#E5E5E5',
	'sideBar.foreground': '#3B3B3B',
	'sideBarSectionHeader.background': '#F8F8F8',
	'sideBarSectionHeader.border': '#E5E5E5',
	'sideBarSectionHeader.foreground': '#3B3B3B',
	'sideBarTitle.foreground': '#3B3B3B',
	'statusBar.background': '#F8F8F8',
	'statusBar.border': '#E5E5E5',
	'statusBar.debuggingBackground': '#FD716C',
	'statusBar.debuggingForeground': '#000000',
	'statusBar.focusBorder': '#005FB8',
	'statusBar.foreground': '#3B3B3B',
	'statusBar.noFolderBackground': '#F8F8F8',
	'statusBarItem.compactHoverBackground': '#CCCCCC',
	'statusBarItem.errorBackground': '#C72E0F',
	'statusBarItem.focusBorder': '#005FB8',
	'statusBarItem.hoverBackground': '#B8B8B850',
	'statusBarItem.prominentBackground': '#6E768166',
	'statusBarItem.remoteBackground': '#005FB8',
	'statusBarItem.remoteForeground': '#FFFFFF',
	'tab.activeBackground': '#FFFFFF',
	'tab.activeBorder': '#F8F8F8',
	'tab.activeBorderTop': '#005FB8',
	'tab.activeForeground': '#3B3B3B',
	'tab.border': '#E5E5E5',
	'tab.hoverBackground': '#FFFFFF',
	'tab.inactiveBackground': '#F8F8F8',
	'tab.inactiveForeground': '#868686',
	'tab.lastPinnedBorder': '#D4D4D4',
	'tab.selectedBackground': '#ffffffa5',
	'tab.selectedBorderTop': '#68a3da',
	'tab.selectedForeground': '#333333b3',
	'tab.unfocusedActiveBorder': '#F8F8F8',
	'tab.unfocusedActiveBorderTop': '#E5E5E5',
	'tab.unfocusedHoverBackground': '#F8F8F8',
	'terminal.foreground': '#3B3B3B',
	'terminal.inactiveSelectionBackground': '#E5EBF1',
	'terminal.tab.activeBorder': '#005FB8',
	'terminalCursor.foreground': '#005FB8',
	'textBlockQuote.background': '#F8F8F8',
	'textBlockQuote.border': '#E5E5E5',
	'textCodeBlock.background': '#F8F8F8',
	'textLink.activeForeground': '#005FB8',
	'textLink.foreground': '#005FB8',
	'textPreformat.background': '#0000001F',
	'textPreformat.foreground': '#3B3B3B',
	'textSeparator.foreground': '#21262D',
	'titleBar.activeBackground': '#F8F8F8',
	'titleBar.activeForeground': '#1E1E1E',
	'titleBar.border': '#E5E5E5',
	'titleBar.inactiveBackground': '#F8F8F8',
	'titleBar.inactiveForeground': '#8B949E',
	'welcomePage.tileBackground': '#F3F3F3',
	'widget.border': '#E5E5E5'
};

export interface IWorkbenchTheme {
	readonly id: string;
	readonly label: string;
	readonly extensionData?: ExtensionData;
	readonly description?: string;
	readonly settingsId: string | null;
}

export interface IWorkbenchColorTheme extends IWorkbenchTheme, IColorTheme {
	readonly settingsId: string;
	readonly tokenColors: ITextMateThemingRule[];
}

export interface IColorMap {
	[id: string]: Color;
}

export interface IWorkbenchFileIconTheme extends IWorkbenchTheme, IFileIconTheme {
}

export interface IWorkbenchProductIconTheme extends IWorkbenchTheme, IProductIconTheme {
	readonly settingsId: string;

	getIcon(icon: IconContribution): IconDefinition | undefined;
}

export type ThemeSettingTarget = ConfigurationTarget | undefined | 'auto' | 'preview';


export interface IWorkbenchThemeService extends IThemeService {
	readonly _serviceBrand: undefined;
	setColorTheme(themeId: string | undefined | IWorkbenchColorTheme, settingsTarget: ThemeSettingTarget): Promise<IWorkbenchColorTheme | null>;
	getColorTheme(): IWorkbenchColorTheme;
	getColorThemes(): Promise<IWorkbenchColorTheme[]>;
	getMarketplaceColorThemes(publisher: string, name: string, version: string): Promise<IWorkbenchColorTheme[]>;
	readonly onDidColorThemeChange: Event<IWorkbenchColorTheme>;

	getPreferredColorScheme(): ColorScheme | undefined;

	setFileIconTheme(iconThemeId: string | undefined | IWorkbenchFileIconTheme, settingsTarget: ThemeSettingTarget): Promise<IWorkbenchFileIconTheme>;
	getFileIconTheme(): IWorkbenchFileIconTheme;
	getFileIconThemes(): Promise<IWorkbenchFileIconTheme[]>;
	getMarketplaceFileIconThemes(publisher: string, name: string, version: string): Promise<IWorkbenchFileIconTheme[]>;
	readonly onDidFileIconThemeChange: Event<IWorkbenchFileIconTheme>;

	setProductIconTheme(iconThemeId: string | undefined | IWorkbenchProductIconTheme, settingsTarget: ThemeSettingTarget): Promise<IWorkbenchProductIconTheme>;
	getProductIconTheme(): IWorkbenchProductIconTheme;
	getProductIconThemes(): Promise<IWorkbenchProductIconTheme[]>;
	getMarketplaceProductIconThemes(publisher: string, name: string, version: string): Promise<IWorkbenchProductIconTheme[]>;
	readonly onDidProductIconThemeChange: Event<IWorkbenchProductIconTheme>;
}

export interface IThemeScopedColorCustomizations {
	[colorId: string]: string;
}

export interface IColorCustomizations {
	[colorIdOrThemeScope: string]: IThemeScopedColorCustomizations | string;
}

export interface IThemeScopedTokenColorCustomizations {
	[groupId: string]: ITextMateThemingRule[] | ITokenColorizationSetting | boolean | string | undefined;
	comments?: string | ITokenColorizationSetting;
	strings?: string | ITokenColorizationSetting;
	numbers?: string | ITokenColorizationSetting;
	keywords?: string | ITokenColorizationSetting;
	types?: string | ITokenColorizationSetting;
	functions?: string | ITokenColorizationSetting;
	variables?: string | ITokenColorizationSetting;
	textMateRules?: ITextMateThemingRule[];
	semanticHighlighting?: boolean; // deprecated, use ISemanticTokenColorCustomizations.enabled instead
}

export interface ITokenColorCustomizations {
	[groupIdOrThemeScope: string]: IThemeScopedTokenColorCustomizations | ITextMateThemingRule[] | ITokenColorizationSetting | boolean | string | undefined;
	comments?: string | ITokenColorizationSetting;
	strings?: string | ITokenColorizationSetting;
	numbers?: string | ITokenColorizationSetting;
	keywords?: string | ITokenColorizationSetting;
	types?: string | ITokenColorizationSetting;
	functions?: string | ITokenColorizationSetting;
	variables?: string | ITokenColorizationSetting;
	textMateRules?: ITextMateThemingRule[];
	semanticHighlighting?: boolean; // deprecated, use ISemanticTokenColorCustomizations.enabled instead
}

export interface IThemeScopedSemanticTokenColorCustomizations {
	[styleRule: string]: ISemanticTokenRules | boolean | undefined;
	enabled?: boolean;
	rules?: ISemanticTokenRules;
}

export interface ISemanticTokenColorCustomizations {
	[styleRuleOrThemeScope: string]: IThemeScopedSemanticTokenColorCustomizations | ISemanticTokenRules | boolean | undefined;
	enabled?: boolean;
	rules?: ISemanticTokenRules;
}

export interface IThemeScopedExperimentalSemanticTokenColorCustomizations {
	[themeScope: string]: ISemanticTokenRules | undefined;
}

export interface IExperimentalSemanticTokenColorCustomizations {
	[styleRuleOrThemeScope: string]: IThemeScopedExperimentalSemanticTokenColorCustomizations | ISemanticTokenRules | undefined;
}

export type IThemeScopedCustomizations =
	IThemeScopedColorCustomizations
	| IThemeScopedTokenColorCustomizations
	| IThemeScopedExperimentalSemanticTokenColorCustomizations
	| IThemeScopedSemanticTokenColorCustomizations;

export type IThemeScopableCustomizations =
	IColorCustomizations
	| ITokenColorCustomizations
	| IExperimentalSemanticTokenColorCustomizations
	| ISemanticTokenColorCustomizations;

export interface ISemanticTokenRules {
	[selector: string]: string | ISemanticTokenColorizationSetting | undefined;
}

export interface ITextMateThemingRule {
	name?: string;
	scope?: string | string[];
	settings: ITokenColorizationSetting;
}

export interface ITokenColorizationSetting {
	foreground?: string;
	background?: string;
	fontStyle?: string; /* [italic|bold|underline|strikethrough] */
	fontFamily?: string;
	fontSize?: number;
	lineHeight?: number;
}

export interface ISemanticTokenColorizationSetting {
	foreground?: string;
	fontStyle?: string; /* [italic|bold|underline|strikethrough] */
	bold?: boolean;
	underline?: boolean;
	strikethrough?: boolean;
	italic?: boolean;
}

export interface ExtensionData {
	extensionId: string;
	extensionPublisher: string;
	extensionName: string;
	extensionIsBuiltin: boolean;
}

export namespace ExtensionData {
	export function toJSONObject(d: ExtensionData | undefined): any {
		return d && { _extensionId: d.extensionId, _extensionIsBuiltin: d.extensionIsBuiltin, _extensionName: d.extensionName, _extensionPublisher: d.extensionPublisher };
	}
	export function fromJSONObject(o: any): ExtensionData | undefined {
		if (o && isString(o._extensionId) && isBoolean(o._extensionIsBuiltin) && isString(o._extensionName) && isString(o._extensionPublisher)) {
			return { extensionId: o._extensionId, extensionIsBuiltin: o._extensionIsBuiltin, extensionName: o._extensionName, extensionPublisher: o._extensionPublisher };
		}
		return undefined;
	}
	export function fromName(publisher: string, name: string, isBuiltin = false): ExtensionData {
		return { extensionPublisher: publisher, extensionId: `${publisher}.${name}`, extensionName: name, extensionIsBuiltin: isBuiltin };
	}
}

export interface IThemeExtensionPoint {
	id: string;
	label?: string;
	description?: string;
	path: string;
	uiTheme?: ThemeTypeSelector;
	_watch: boolean; // unsupported options to watch location
}
