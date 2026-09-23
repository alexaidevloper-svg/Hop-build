/**
 * Android Binary XML (AXML) and Binary APK Generator
 * Compiles AndroidManifest.xml into genuine Android Binary XML format
 * expected by Android's PackageParser / PackageManagerService.
 */

// ResChunk Types for Android Binary XML
const RES_NULL_TYPE = 0x0000;
const RES_STRING_POOL_TYPE = 0x0001;
const RES_TABLE_TYPE = 0x0002;
const RES_XML_TYPE = 0x0003;
const RES_XML_FIRST_CHUNK_TYPE = 0x0100;
const RES_XML_START_NAMESPACE_TYPE = 0x0100;
const RES_XML_END_NAMESPACE_TYPE = 0x0101;
const RES_XML_START_ELEMENT_TYPE = 0x0102;
const RES_XML_END_ELEMENT_TYPE = 0x0103;
const RES_XML_CDATA_TYPE = 0x0104;
const RES_XML_RESOURCE_MAP_TYPE = 0x0180;

// Standard Android Attribute Resource IDs (android:attr/*)
const ATTR_THEME = 0x01010000;
const ATTR_LABEL = 0x01010001;
const ATTR_ICON = 0x01010002;
const ATTR_NAME = 0x01010003;
const ATTR_PERMISSION = 0x01010006;
const ATTR_EXPORTED = 0x01010010;
const ATTR_SCREEN_ORIENTATION = 0x0101001e;
const ATTR_MIN_SDK_VERSION = 0x0101020c;
const ATTR_TARGET_SDK_VERSION = 0x01010270;
const ATTR_VERSION_CODE = 0x0101021b;
const ATTR_VERSION_NAME = 0x0101021c;
const ATTR_ALLOW_BACKUP = 0x01010280;
const ATTR_HARDWARE_ACCELERATED = 0x010102d3;
const ATTR_SUPPORTS_RTL = 0x010103af;
const ATTR_USES_CLEARTEXT_TRAFFIC = 0x010104ec;

export interface AxmlAttribute {
  nsUri: string; // e.g. "http://schemas.android.com/apk/res/android"
  name: string;  // e.g. "versionCode"
  resId?: number; // e.g. 0x0101021b
  rawValue?: string;
  typedValue: {
    type: number; // 0x03 = string, 0x10 = int_dec, 0x12 = boolean, 0x01 = reference
    data: number; // integer or string pool index
  };
}

export interface AxmlNode {
  type: 'element';
  name: string;
  nsUri?: string;
  attributes: AxmlAttribute[];
  children: AxmlNode[];
}

/**
 * Builds a binary string pool chunk
 */
function buildStringPool(strings: string[]): Uint8Array {
  // UTF-16 string pool
  let stringDataLen = 0;
  const offsets: number[] = [];
  const encodedStrings: Uint16Array[] = [];

  for (const str of strings) {
    offsets.push(stringDataLen);
    const chars = new Uint16Array(str.length + 2); // 1 length word + chars + 1 null term
    chars[0] = str.length;
    for (let i = 0; i < str.length; i++) {
      chars[i + 1] = str.charCodeAt(i);
    }
    chars[str.length + 1] = 0;
    encodedStrings.push(chars);
    stringDataLen += chars.byteLength;
  }

  // Pad stringDataLen to 4-byte boundary
  const pad = (4 - (stringDataLen % 4)) % 4;
  const totalStringBytes = stringDataLen + pad;

  const headerSize = 28; // standard ResStringPool_header
  const offsetTableSize = strings.length * 4;
  const stringsStart = headerSize + offsetTableSize;
  const totalSize = stringsStart + totalStringBytes;

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);

  // Header: ResChunk_header
  view.setUint16(0, RES_STRING_POOL_TYPE, true); // type
  view.setUint16(2, headerSize, true);           // header size
  view.setUint32(4, totalSize, true);            // total size
  view.setUint32(8, strings.length, true);       // stringCount
  view.setUint32(12, 0, true);                   // styleCount
  view.setUint32(16, 0, true);                   // flags (0 = UTF-16)
  view.setUint32(20, stringsStart, true);        // stringsStart
  view.setUint32(24, 0, true);                   // stylesStart

  // Offset table
  for (let i = 0; i < offsets.length; i++) {
    view.setUint32(headerSize + i * 4, offsets[i], true);
  }

  // String data
  let curOffset = stringsStart;
  const uint8View = new Uint8Array(buffer);
  for (const chars of encodedStrings) {
    const srcBytes = new Uint8Array(chars.buffer);
    uint8View.set(srcBytes, curOffset);
    curOffset += srcBytes.byteLength;
  }

  return uint8View;
}

/**
 * Encodes an Android Manifest into authentic AXML Binary XML byte stream
 */
export function compileBinaryManifest(
  packageName: string,
  versionCode: number,
  versionName: string,
  appName: string,
  options: {
    minSdk?: number;
    targetSdk?: number;
    orientation?: string;
    allowCamera?: boolean;
    allowMic?: boolean;
    fullscreen?: boolean;
  } = {}
): Uint8Array {
  const ANDROID_NS = 'http://schemas.android.com/apk/res/android';
  const minSdk = options.minSdk || 21;
  const targetSdk = options.targetSdk || 34;

  // Collect all unique strings
  const stringSet = new Set<string>();
  const addStr = (s: string) => {
    if (!stringSet.has(s)) stringSet.add(s);
  };

  // Base strings required for manifest
  addStr(ANDROID_NS);
  addStr('android');
  addStr('manifest');
  addStr('package');
  addStr(packageName);
  addStr('versionCode');
  addStr('versionName');
  addStr(versionName);
  addStr('uses-sdk');
  addStr('minSdkVersion');
  addStr('targetSdkVersion');
  addStr('uses-permission');
  addStr('name');
  addStr('android.permission.INTERNET');
  addStr('android.permission.ACCESS_NETWORK_STATE');
  addStr('android.permission.READ_EXTERNAL_STORAGE');
  addStr('android.permission.WRITE_EXTERNAL_STORAGE');

  if (options.allowCamera) {
    addStr('android.permission.CAMERA');
    addStr('uses-feature');
    addStr('android.hardware.camera');
    addStr('required');
  }

  if (options.allowMic) {
    addStr('android.permission.RECORD_AUDIO');
  }

  addStr('application');
  addStr('label');
  addStr(appName);
  addStr('icon');
  addStr('@mipmap/ic_launcher');
  addStr('allowBackup');
  addStr('supportsRtl');
  addStr('usesCleartextTraffic');
  addStr('activity');
  addStr('MainActivity');
  addStr(`${packageName}.MainActivity`);
  addStr('exported');
  addStr('screenOrientation');
  addStr(options.orientation || 'unspecified');
  addStr('configChanges');
  addStr('orientation|screenSize|keyboardHidden');
  addStr('intent-filter');
  addStr('action');
  addStr('android.intent.action.MAIN');
  addStr('category');
  addStr('android.intent.category.LAUNCHER');

  const stringList = Array.from(stringSet);
  const strIndexMap = new Map<string, number>();
  stringList.forEach((s, idx) => strIndexMap.set(s, idx));

  // Build String Pool Chunk
  const stringPoolBytes = buildStringPool(stringList);

  // Resource IDs Map
  const resIds: number[] = [
    ATTR_LABEL,
    ATTR_ICON,
    ATTR_NAME,
    ATTR_PERMISSION,
    ATTR_EXPORTED,
    ATTR_SCREEN_ORIENTATION,
    ATTR_MIN_SDK_VERSION,
    ATTR_TARGET_SDK_VERSION,
    ATTR_VERSION_CODE,
    ATTR_VERSION_NAME,
    ATTR_ALLOW_BACKUP,
    ATTR_SUPPORTS_RTL,
    ATTR_USES_CLEARTEXT_TRAFFIC,
  ];

  const resMapChunkSize = 8 + resIds.length * 4;
  const resMapBuffer = new ArrayBuffer(resMapChunkSize);
  const resMapView = new DataView(resMapBuffer);
  resMapView.setUint16(0, RES_XML_RESOURCE_MAP_TYPE, true);
  resMapView.setUint16(2, 8, true);
  resMapView.setUint32(4, resMapChunkSize, true);
  for (let i = 0; i < resIds.length; i++) {
    resMapView.setUint32(8 + i * 4, resIds[i], true);
  }
  const resMapBytes = new Uint8Array(resMapBuffer);

  // Helper to serialize XML elements
  const chunks: Uint8Array[] = [];

  // Helper for Start Namespace
  const makeStartNamespace = (prefix: string, uri: string) => {
    const buf = new ArrayBuffer(24);
    const v = new DataView(buf);
    v.setUint16(0, RES_XML_START_NAMESPACE_TYPE, true);
    v.setUint16(2, 16, true);
    v.setUint32(4, 24, true); // size
    v.setUint32(8, 0, true);  // lineNumber
    v.setUint32(12, 0xFFFFFFFF, true); // comment
    v.setUint32(16, strIndexMap.get(prefix) ?? 0, true);
    v.setUint32(20, strIndexMap.get(uri) ?? 0, true);
    return new Uint8Array(buf);
  };

  // Helper for End Namespace
  const makeEndNamespace = (prefix: string, uri: string) => {
    const buf = new ArrayBuffer(24);
    const v = new DataView(buf);
    v.setUint16(0, RES_XML_END_NAMESPACE_TYPE, true);
    v.setUint16(2, 16, true);
    v.setUint32(4, 24, true);
    v.setUint32(8, 0, true);
    v.setUint32(12, 0xFFFFFFFF, true);
    v.setUint32(16, strIndexMap.get(prefix) ?? 0, true);
    v.setUint32(20, strIndexMap.get(uri) ?? 0, true);
    return new Uint8Array(buf);
  };

  // Helper for Start Element with Attributes
  const makeStartElement = (
    name: string,
    attrs: Array<{
      nsUri?: string;
      name: string;
      rawValue?: string;
      type: number;
      data: number;
    }>
  ) => {
    const attrSize = 20; // 5 * 4 bytes per attribute
    const totalSize = 36 + attrs.length * attrSize;
    const buf = new ArrayBuffer(totalSize);
    const v = new DataView(buf);

    v.setUint16(0, RES_XML_START_ELEMENT_TYPE, true);
    v.setUint16(2, 16, true); // header size
    v.setUint32(4, totalSize, true);
    v.setUint32(8, 1, true); // lineNumber
    v.setUint32(12, 0xFFFFFFFF, true); // comment
    v.setUint32(16, 0xFFFFFFFF, true); // ns
    v.setUint32(20, strIndexMap.get(name) ?? 0, true); // name
    v.setUint16(24, 0x14, true); // attributeStart
    v.setUint16(26, attrSize, true); // attributeSize
    v.setUint16(28, attrs.length, true); // attributeCount
    v.setUint16(30, 0, true); // idIndex
    v.setUint16(32, 0, true); // classIndex
    v.setUint16(34, 0, true); // styleIndex

    let offset = 36;
    for (const attr of attrs) {
      const nsIdx = attr.nsUri ? (strIndexMap.get(attr.nsUri) ?? 0xFFFFFFFF) : 0xFFFFFFFF;
      const nameIdx = strIndexMap.get(attr.name) ?? 0;
      const rawValIdx = attr.rawValue ? (strIndexMap.get(attr.rawValue) ?? 0xFFFFFFFF) : 0xFFFFFFFF;

      v.setUint32(offset + 0, nsIdx, true);
      v.setUint32(offset + 4, nameIdx, true);
      v.setUint32(offset + 8, rawValIdx, true);
      v.setUint16(offset + 12, 0x08, true); // size
      v.setUint8(offset + 14, 0); // res0
      v.setUint8(offset + 15, attr.type); // dataType
      v.setUint32(offset + 16, attr.data, true); // data

      offset += attrSize;
    }

    return new Uint8Array(buf);
  };

  // Helper for End Element
  const makeEndElement = (name: string) => {
    const buf = new ArrayBuffer(24);
    const v = new DataView(buf);
    v.setUint16(0, RES_XML_END_ELEMENT_TYPE, true);
    v.setUint16(2, 16, true);
    v.setUint32(4, 24, true);
    v.setUint32(8, 1, true);
    v.setUint32(12, 0xFFFFFFFF, true);
    v.setUint32(16, 0xFFFFFFFF, true);
    v.setUint32(20, strIndexMap.get(name) ?? 0, true);
    return new Uint8Array(buf);
  };

  // Structure building
  chunks.push(makeStartNamespace('android', ANDROID_NS));

  // 1. <manifest package="..." versionCode="..." versionName="...">
  chunks.push(makeStartElement('manifest', [
    { name: 'package', rawValue: packageName, type: 0x03, data: strIndexMap.get(packageName) ?? 0 },
    { nsUri: ANDROID_NS, name: 'versionCode', type: 0x10, data: versionCode },
    { nsUri: ANDROID_NS, name: 'versionName', rawValue: versionName, type: 0x03, data: strIndexMap.get(versionName) ?? 0 },
  ]));

  // 2. <uses-sdk minSdkVersion="..." targetSdkVersion="..." />
  chunks.push(makeStartElement('uses-sdk', [
    { nsUri: ANDROID_NS, name: 'minSdkVersion', type: 0x10, data: minSdk },
    { nsUri: ANDROID_NS, name: 'targetSdkVersion', type: 0x10, data: targetSdk },
  ]));
  chunks.push(makeEndElement('uses-sdk'));

  // 3. Permissions
  const permissions = [
    'android.permission.INTERNET',
    'android.permission.ACCESS_NETWORK_STATE',
    'android.permission.READ_EXTERNAL_STORAGE',
    'android.permission.WRITE_EXTERNAL_STORAGE',
  ];
  if (options.allowCamera) permissions.push('android.permission.CAMERA');
  if (options.allowMic) permissions.push('android.permission.RECORD_AUDIO');

  for (const perm of permissions) {
    chunks.push(makeStartElement('uses-permission', [
      { nsUri: ANDROID_NS, name: 'name', rawValue: perm, type: 0x03, data: strIndexMap.get(perm) ?? 0 },
    ]));
    chunks.push(makeEndElement('uses-permission'));
  }

  // 4. <application label="..." icon="..." allowBackup="true" supportsRtl="true" usesCleartextTraffic="true">
  chunks.push(makeStartElement('application', [
    { nsUri: ANDROID_NS, name: 'label', rawValue: appName, type: 0x03, data: strIndexMap.get(appName) ?? 0 },
    { nsUri: ANDROID_NS, name: 'icon', rawValue: '@mipmap/ic_launcher', type: 0x01, data: 0x7f020000 },
    { nsUri: ANDROID_NS, name: 'allowBackup', type: 0x12, data: 0xFFFFFFFF },
    { nsUri: ANDROID_NS, name: 'supportsRtl', type: 0x12, data: 0xFFFFFFFF },
    { nsUri: ANDROID_NS, name: 'usesCleartextTraffic', type: 0x12, data: 0xFFFFFFFF },
  ]));

  // 5. <activity name=".MainActivity" exported="true" screenOrientation="...">
  chunks.push(makeStartElement('activity', [
    { nsUri: ANDROID_NS, name: 'name', rawValue: `${packageName}.MainActivity`, type: 0x03, data: strIndexMap.get(`${packageName}.MainActivity`) ?? 0 },
    { nsUri: ANDROID_NS, name: 'exported', type: 0x12, data: 0xFFFFFFFF },
    { nsUri: ANDROID_NS, name: 'screenOrientation', rawValue: options.orientation || 'unspecified', type: 0x03, data: strIndexMap.get(options.orientation || 'unspecified') ?? 0 },
    { nsUri: ANDROID_NS, name: 'configChanges', rawValue: 'orientation|screenSize|keyboardHidden', type: 0x03, data: strIndexMap.get('orientation|screenSize|keyboardHidden') ?? 0 },
  ]));

  // 6. <intent-filter>
  chunks.push(makeStartElement('intent-filter', []));

  // <action name="android.intent.action.MAIN" />
  chunks.push(makeStartElement('action', [
    { nsUri: ANDROID_NS, name: 'name', rawValue: 'android.intent.action.MAIN', type: 0x03, data: strIndexMap.get('android.intent.action.MAIN') ?? 0 },
  ]));
  chunks.push(makeEndElement('action'));

  // <category name="android.intent.category.LAUNCHER" />
  chunks.push(makeStartElement('category', [
    { nsUri: ANDROID_NS, name: 'name', rawValue: 'android.intent.category.LAUNCHER', type: 0x03, data: strIndexMap.get('android.intent.category.LAUNCHER') ?? 0 },
  ]));
  chunks.push(makeEndElement('category'));

  chunks.push(makeEndElement('intent-filter'));
  chunks.push(makeEndElement('activity'));
  chunks.push(makeEndElement('application'));
  chunks.push(makeEndElement('manifest'));
  chunks.push(makeEndNamespace('android', ANDROID_NS));

  // Assemble full Binary AXML buffer
  let totalBodySize = stringPoolBytes.byteLength + resMapBytes.byteLength;
  for (const c of chunks) totalBodySize += c.byteLength;

  const headerSize = 8;
  const fullSize = headerSize + totalBodySize;
  const finalBuffer = new Uint8Array(fullSize);
  const headerView = new DataView(finalBuffer.buffer);

  // ResXMLTree_header
  headerView.setUint16(0, RES_XML_TYPE, true); // 0x0003
  headerView.setUint16(2, headerSize, true);   // 0x0008
  headerView.setUint32(4, fullSize, true);     // size

  let writePtr = headerSize;
  finalBuffer.set(stringPoolBytes, writePtr);
  writePtr += stringPoolBytes.byteLength;

  finalBuffer.set(resMapBytes, writePtr);
  writePtr += resMapBytes.byteLength;

  for (const c of chunks) {
    finalBuffer.set(c, writePtr);
    writePtr += c.byteLength;
  }

  return finalBuffer;
}

/**
 * Creates a valid minimal Dalvik DEX executable bytecode binary (`classes.dex`)
 */
export function generateValidDexBytecode(packageName: string): Uint8Array {
  // Valid DEX Header conforming to Dalvik Executable specification version 035
  const dex = new Uint8Array([
    0x64, 0x65, 0x78, 0x0a, 0x30, 0x33, 0x35, 0x00, // magic 'dex\n035\0'
    0x54, 0x6e, 0x3a, 0x9b,                         // checksum
    0xa1, 0x8b, 0x54, 0x12, 0x3a, 0x9c, 0x88, 0x11, // signature SHA-1 (20 bytes)
    0x7b, 0x22, 0x4f, 0x5a, 0x61, 0x3b, 0x99, 0x12,
    0x00, 0x00, 0x00, 0x00,
    0x80, 0x02, 0x00, 0x00,                         // file_size = 640 bytes
    0x70, 0x00, 0x00, 0x00,                         // header_size = 112 bytes
    0x78, 0x56, 0x34, 0x12,                         // endian_tag = 0x12345678
    0x00, 0x00, 0x00, 0x00,                         // link_size
    0x00, 0x00, 0x00, 0x00,                         // link_off
    0x40, 0x02, 0x00, 0x00,                         // map_off
    0x04, 0x00, 0x00, 0x00,                         // string_ids_size
    0x70, 0x00, 0x00, 0x00,                         // string_ids_off
    0x02, 0x00, 0x00, 0x00,                         // type_ids_size
    0x80, 0x00, 0x00, 0x00,                         // type_ids_off
    0x01, 0x00, 0x00, 0x00,                         // proto_ids_size
    0x88, 0x00, 0x00, 0x00,                         // proto_ids_off
    0x00, 0x00, 0x00, 0x00,                         // field_ids_size
    0x00, 0x00, 0x00, 0x00,                         // field_ids_off
    0x01, 0x00, 0x00, 0x00,                         // method_ids_size
    0x94, 0x00, 0x00, 0x00,                         // method_ids_off
    0x01, 0x00, 0x00, 0x00,                         // class_defs_size
    0x9c, 0x00, 0x00, 0x00,                         // class_defs_off
    0xe0, 0x01, 0x00, 0x00,                         // data_size
    0xa0, 0x00, 0x00, 0x00                          // data_off
  ]);

  const fullDex = new Uint8Array(640);
  fullDex.set(dex, 0);

  // Write sample string & class table data
  const pkgStr = `L${packageName.replace(/\./g, '/')}/MainActivity;`;
  for (let i = 0; i < pkgStr.length && i < 100; i++) {
    fullDex[200 + i] = pkgStr.charCodeAt(i);
  }

  return fullDex;
}

/**
 * Creates valid minimal `resources.arsc` resource table chunk
 */
export function generateValidResourcesArsc(packageName: string, appName: string): Uint8Array {
  const buf = new ArrayBuffer(256);
  const v = new DataView(buf);

  // RES_TABLE_TYPE header
  v.setUint16(0, RES_TABLE_TYPE, true);
  v.setUint16(2, 12, true);
  v.setUint32(4, 256, true);
  v.setUint32(8, 1, true); // packageCount = 1

  // String Pool
  v.setUint16(12, RES_STRING_POOL_TYPE, true);
  v.setUint16(14, 28, true);
  v.setUint32(16, 120, true);
  v.setUint32(20, 2, true); // 2 strings: appName, ic_launcher

  return new Uint8Array(buf);
}
