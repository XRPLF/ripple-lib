# Migration Guide

Xrpl.js 3.0 reduces bundle size by 60% and completely removes the need for polyfills for browser applications. It does this with minimal breaking changes. It accomplished this by replacing node specific dependencies with ones which would work in the browser.

The primary breaking change is updating all `Buffer` types to `Uint8Array` since `Buffer` is not supported in the browser. `Buffer` objects can usually be directly replaced with `UInt8Array` as `Buffer` extends `Uint8Array`. The primary difference in functionality is that `Buffer` has additional helper functions. We've listed all functions affected by this change below in the `Uint8Array` section.

This migration guide also applies to:
`ripple-address-codec` 4.3.1 -> 5.0.0
`ripple-binary-codec` 1.11.0 -> 2.0.0
`ripple-keypairs` 1.3.1 -> 2.0.0

# Why update to 3.0?

At a high level:

1. 60% filesize reduction
2. Simplified setup by removing polyfills
3. Increased reliability

<aside>
💡 Also, with 3.0, the [reference docs](https://js.xrpl.org/) have received a massive update to include examples, more readable type information, and properly display documentation on functions which are part of the `Client` class.
</aside>

## 1. 60% size reduction

Through simplifying 3rd party dependencies, xrpl.js is now a much ligher-weight library.

One major source of the project’s large bundle size was polyfills, code that replicated Node specific features in the browser. Instead, we shifted to using 3rd party packages which worked in both Node and the browser by default.

A simple fix was removing `lodash` by using es6 array methods and porting over simple helper utilities.

The last main source of the reduction was simplifying the 5 large number libraries down to one.

Before, we had `decimal.js`, `bit-integer`, `bitnumber.js`, and two versions of `bn.js` due to `elliptic`'s transitive dependency tree.

After, we used `@noble` to replace `elliptic` to have just one version of `bn.js`, and normalized our library to just use `bignumber.js` across the board.

## 2. No more polyfills required (simplified install)

Polyfills made it hard to setup xrpl.js in the browser as they required custom bundler configs. By using dependencies and browser-native features, xrpl.js can now work just by installing from `npm` in most cases.

For the cryptography libraries, we switched from using `elliptic`, `create-hash`, and other crypto polyfills to using the `@noble` suite of packages. For situations where node-specific crypto functions performed better, we created `@xrplf/isomorphic` to dynamically choose which implementation to use depending on the runtime environment.

<aside>
💡 The `@noble` suite of packages includes `@noble/hashes`, `@noble/curves`, `@scure/bip32`, `@scure/bip39`, and `@scure/base`
</aside>

We eliminated the polyfills for `http`, `https`, and `url` by using the native `fetch` in the browser.

The easiest to replace were `assert` (which was replaced by simple conditions & exceptions) and `utils` (which used `JSON.stringify` instead of `inspect`).

Lastly, the `buffer` polyfill turned out to be the trickiest to remove, resulting in the largest number of breaking changes. Since the `Buffer` object is not native to the browser all apis were migrated to the superclass of `Buffer` → `Uint8Arrays`. For a detailed write up of why we and many libraries are choosing to make this transition, check out this [blog post](https://sindresorhus.com/blog/goodbye-nodejs-buffer) by Sindre Sorhus.

## 3. Increased Reliability

With xrpl.js 3.0, we improved our test coverage in the browser. Specifically, we added browser unit testing to all packages in the monorepo other than the `xrpl` package. Note that the `xrpl` package has browser coverage through our integration tests.

We achieved this by adding a `karma` config to every project that uses webpack to bundle each lib, then run the tests in Chrome. Hopefully soon we’ll also be able to add support for the `xrpl` package to run it’s unit tests in Chrome as part of our CI process.

# Breaking Changes Detailed Migration Guide

Here’s a high-level overview of the breaking changes.

<aside>
💡 Note that the vast majority of these changes are very small typing changes, which should have direct 1-line replacements.
</aside>

1. The largest change is that all instances of `Buffer` have been replaced by `Uint8Array` **[Link](#1-buffer-to-uint8array)**
2. All “large number” types have been consolidated to either `bigint` or `BigNumber` **[Link](#2-large-number-handling)**
3. Polyfill configuration changes **[Link](#3-polyfill-configuration-changes)**
4. `dropsToXRP` and `Client.getXrpBalance` now return a `number` instead of a `string` **[Link](#4-dropstoxrp-and-clientgetxrpbalance-now-return-a-number-instead-of-a-string)**
5. `xrpl-secret-numbers` has been moved into the mono-repo as `@xrplf/secret-numbers`  **[Link](#5-xrpl-secret-numbers-has-been-moved-into-the-mono-repo-as-xrplfsecret-numbers)**
6. Support for Node 14 has been dropped **[Link](#6-support-for-node-14-has-been-dropped)**
7. Configuring proxies with the Client  **[Link](#7-configuring-proxies-with-the-client)**
8. Bug fix: Setting an explicit `algorithm` when generating a wallet works now **[Link](#8-bug-fix-setting-an-explicit-algorithm-when-generating-a-wallet-works-now)**
9. `AssertionError` → `Error` **[Link](#9-assertionerror-→-error)**
10. Pre-bundle browser builds **[Link](#10-pre-bundle-browser-builds)**
11. We’ve updated the `Transaction` type to include pseudotransactions **[Link](#11-transaction-type)**
12. `authorizeChannel` was moved **[Link](#12-authorizechannel-was-moved)**
13. Removed the deprecated `BroadcastClient` **[Link](#13-weve-removed-the-deprecated-broadcastclient)**

Without further ado, here’s the detailed changes and how to migrate:

### 1. `Buffer` to `Uint8Array`

In most cases, `Uint8Array` can act as a drop-in replacement for `Buffer` data since `Buffer` is a subclass of `Uint8Array`. The main differences are that `Uint8Array` has fewer helper methods, and slightly different syntax for converting from other data types. This difference primarily affects methods whose return type is changed. (For functions whose parameters were changed to `Uint8Array`, `Buffer` should still be a valid parameter as it’s a subclass of `Uint8Array`)

Please see this [blog post](https://sindresorhus.com/blog/goodbye-nodejs-buffer) for detailed examples of how to migrate `Buffer` to `Unit8Array`.

Below is a list of every method affected. 

**`ripple-address-codec`**

- `decodeAccountID`
- `encodeAccountID`
- `decodeAccountPublic`
- `encodeAccountPublic`
- `decodeNodePublic`
- `encodeNodePublic`
- `encodeSeed`
- `decodeXAddress`
- `encodeXAddress`

**`ripple-binary-codec`**

- `SerializedType` constructor and `toBytes` . Its sub-classes:
    - `AccountID`
    - `Amount`
    - `Blob`
    - `Currency`
    - `Hash`
    - `Hash128`
    - `Hash160`
    - `Hash256`
    - `Issue`
    - `PathSet`
    - `STArray`
    - `STObject`
    - `UInt`
    - `UInt8`
    - `UInt16`
    - `UInt32`
    - `UInt64`
    - `Vector256`
    - `XChainBridge`
- `ShaMapNode.hashPrefix`
- `BinarySerializer.put`
- `BytesList.put` and `BytesList.toBytes`
- `BinaryParser.read`
- `BinaryParser.readVariableLength`
- `Quality.encode` and `Quality.decode`
- `Sha512Half.put` and `Sha512Half.finish256`
- `transactionID`
- `sha512Half`
- Entries of `HashPrefix`
- Type `FieldInstance.header`
- `Bytes.bytes`
- `signingClaimData`
- `serializeObject`
- `makeParser`

**`secret-numbers`**

- `entropyToSecret`
- `randomEntropy`
- `Account` constructor

**`xrpl`**

- `rfc1751MnemonicToKey`

### 2. Large Number Handling

`bn.js`, `decimal.js` and `big-integer` were removed as dependencies. They usages were replaced with `BigNumber` from `big-number.js` (was already a dependency) and the native javascript object `BigInt`.

- `UInt64.valueOf` returns `bigint` instead of `BigInteger`
- `SerializeType.from` can take a `bigint` instead `BigInteger`
- `ledgerHash` had its param object change so that `total_coins` in a `bigint` instead `BigInteger`
- `Quality.decode` returns a `BigNumber` instead of a `Decimal`
- `Amount.assertIouIsValid` take a `BigNumber` instead `Decimal`
- `Amount.verifyNoDecimal` takes a `BigNumber` instead `Decimal`

### 3. Polyfill configuration changes

For `vite` and `create-react-app` you can remove all xrpl.js polyfills/configurations. This also includes the custom mappings for `ws` to `WsWrapper` and the exclusion of `https-proxy-agent`. You should also be able to remove polyfills for other bundlers / frameworks, but we have only extensively tested `vite` and `create-react-app` configurations.

**React Native**

Please follow the updated guide at UNIQUE_SETUPS.md (Many polyfills are no longer required, but not all are eliminated for this environment).

### 4. `dropsToXRP` and `Client.getXrpBalance` now return a `number` instead of a `string`

This should make it easier to work with the numbers. Because the max size of XRP is 100 billion, we can use a `number` instead of a larger type like `bigint` (which is normally needed when working with issued tokens on the XRPL).

### 5. `xrpl-secret-numbers` has been moved into the mono-repo as `@xrplf/secret-numbers`

This move allows us to continue maintaining this package going forward as well as giving us more control over the dependencies to avoid needing polyfills.

If you were using `xrpl-secret-numbers` directly, please update your imports to the new package (`@xrplf/secret-numbers`) to receive updates going forward.

Besides making changes to this package to update from `Buffer` → `Uint8Array` you will need to update all places where you use functions on the `Util` object. These methods are now at the root of the library. These methods include:

- `Utils.randomEntropy` → `randomEntropy`
- `Utils.randomSecret` → `randomSecret`
- `Utils.entropyToSecret` → `entropyToSecret`
- `Utils.secretToEntropy` → `secretToEntropy`
- `Utils.calculateChecksum` → `calculateChecksum`
- `Utils.checkChecksum` → `checkChecksum`
- `Utils.parseSecretString` → `parseSecretString`

### 6. Support for Node 14 has been dropped

Node 14 has stopped receiving security updates since April 2023, and so we’ve decided to no longer support it going forward. Please update to one of the supported versions of Node as listed in xrpl.js’s `README.md`.

### 7. Configuring proxies with the Client

The way to configure proxies for `Client` has changed. It is now done by specifying the `agent` parameter on the `ConnectionOptions` config.

You can generate an `agent` with libraries such as `https-proxy-agent` or any that implements `http.Agent`.

This was done to remove a hard dependency on `https-proxy-agent` when running in the browser and to support `https-proxy-agent@7` which changed several option names. Proxy support was never supported in the browser, and merely burdened xrpl bundles with unused dependencies.

**Before**

`{
  proxy: `ws://127.0.0.1:${port}`,
  authorization: 'authorization',
  trustedCertificates: ['path/to/pem'],
}`

**After**

 `{
   agent: new HttpsProxyAgent<string>(`ws://127.0.0.1:${port}`, {
     ca: ['path/to/pem'],
   }),
   authorization: 'authorization'
 }`

### 8. Bug fix: Setting an explicit `algorithm` when generating a wallet works now

`Wallet.generate()` and `Wallet.fromSeed` were ignoring the `algorithm` parameter. This means that if you were manually specifying `algorithm` in any `Wallet` constructors, you may generate a different `Wallet` keypair when upgrading to 3.0. In that case to get the same generated wallets as before, don’t specify the `algorithm` parameter.

### 9. `AssertionError` → `Error`

In order to get rid of the `assert` polyfill, we’ve replaced `AssertionError`s with `Error` exceptions. We’ve also updated the error messages to be more descriptive. If you were catching those specific errors, you will have to update your catch statements.

This impacts most of `ripple-keypairs` functions but only if you already had issues with incompatible values.

### 10. Pre-bundle browser builds

If you use the pre bundled version of the library you will need to make the following changes:

- Change any references to `dist/browerified.js` to `build/xrplf-secret-numbers-latest.js`.
- Access any methods as properties of `xrplf_secret_numbers` instead of using browserify's loader.

### 11. Transaction` type

`Transaction` has been updated to include `PseudoTransaction`s. To get the equivalent of the old `Transaction` type which only included transactions users could submit, please use `SubmittableTransaction`.

This effectively changes the signature of the following methods:

- `Client.autofill`
- `Client.submit`
- `Client.submitAndWait`
- `Client.prepareTransaction`
- `getSignedTx`
- `isAccountDelete`

### 12. `authorizeChannel` was moved

We’ve moved `authorizeChannel` from `wallet/signer` to `wallet/authorizeChannel` to solve a circular dependency issue. You may have to update your import path as a result.

### 13. We’ve removed the deprecated `BroadcastClient`

This feature was never fully implemented, and was marked as deprecated for several years. With 3.0 we’ve fully removed any code relating to it.

# Wrap up

Thanks for taking the time to read & migrate to xrpl.js 3.0. Hopefully this helps speed up browser applications, simplifies setup, and provides a better development experience.

If you run into any problems, please [create an issue](https://github.com/XRPLF/xrpl.js/issues) on our GitHub repo.
