## Description

This a nest js module that could help you build a CMS system rapidly. Once you import this module, your nest project will get a set of standard restful APIs to do CRUD, besides, you could inject your own logic to these APIs(even build a new API) through the built-in hooks.

## Why This Module

While there are already many CMS systems in the community, including many so-called "headless" CMS platforms that aim to provide out-of-the-box solutions, they remain third-party systems that require integration. Though user-friendly and seemingly extensible, this integration process often undermines their "out-of-the-box" appeal, making them feel cumbersome.

If you're developing a system with NestJS and Mongoose and need CMS-like capabilities, this module is tailor-made for you. Simply import it, and core CMS functionalities will seamlessly integrate into your existing system—no mental overhead required. If the module doesn’t fully meet your needs, leverage its built-in hooks for deep customization.

In short, this module focuses solely on delivering capabilities without locking you into any specific conventions.

## Prerequisites

This module is restricted to be used when your nestjs project is using [nest mongoose module](https://docs.nestjs.com/techniques/mongodb).

## Installation
```
npm install @nestjs/mongoose mongoose @nest-mongo-cms/core
```

## Quick Start

* Configure the MongooseModule and register the CMS module
```
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CMSModule } from '@nest-mongo-cms/core';
import { MongooseModule } from '@nestjs/mongoose';
import CatSchema from './cat.schema';
@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost/nest'),
    MongooseModule.forFeature([{ name: 'cats', schema: CatSchema }]),
    CMSModule.register({
      path: '/cms',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

```
* A set of restful APIs are activated.
```
[Nest] 492  - 05/13/2025, 10:33:48 AM     LOG [RoutesResolver] CMSController {/cms}: +0ms
[Nest] 492  - 05/13/2025, 10:33:48 AM     LOG [RouterExplorer] Mapped {/cms/:schema, GET} route +0ms
[Nest] 492  - 05/13/2025, 10:33:48 AM     LOG [RouterExplorer] Mapped {/cms/:schema/:id, GET} route +1ms
[Nest] 492  - 05/13/2025, 10:33:48 AM     LOG [RouterExplorer] Mapped {/cms/:schema, POST} route +0ms
[Nest] 492  - 05/13/2025, 10:33:48 AM     LOG [RouterExplorer] Mapped {/cms/:schema, PUT} route +0ms
[Nest] 492  - 05/13/2025, 10:33:48 AM     LOG [RouterExplorer] Mapped {/cms/:schema/:id, PUT} route +0ms
[Nest] 492  - 05/13/2025, 10:33:48 AM     LOG [RouterExplorer] Mapped {/cms/:schema, DELETE} route +0ms
[Nest] 492  - 05/13/2025, 10:33:48 AM     LOG [RouterExplorer] Mapped {/cms/:schema/:id, DELETE} route +0ms
[Nest] 492  - 05/13/2025, 10:33:48 AM     LOG [RouterExplorer] Mapped {/cms/operation/:schema/:operationType/:action, POST} route +1ms
```

## Configure the module

| Item | Value | Description |
|-------|------|-------|
| path | string | prefix of cms api |
| connectionName | string | mongoose connectionName |
|schemas|Object|schema configuration|
|plugins|Object|activate your own plugin|

## Hooks
Each Hook exposes a special parameter called `defer`, which deserves explicit emphasis upfront. ​If your Hook involves either of the following types of operations:
* Data-mutating actions​ (e.g., database writes, state changes) that impact external or internal systems.

* Non-idempotent or irreversible operations​ (e.g., network calls, file system operations) that cannot be easily rolled back or replayed.
​You should wrap these operations with defer.​​ Actions captured by defer are ​not executed immediately; instead, they are queued and triggered ​atomically​ only after ​all Hooks have completed successfully.

​Why this matters:
Certain Hooks might intentionally terminate the execution flow (e.g., due to permission errors, validation failures, or business logic interruptions). If sensitive operations are not deferred, partial execution could leave global data in an inconsistent state (e.g., some changes committed while others were aborted). By deferring such operations, you ensure ​all-or-nothing semantics: either all deferred actions execute, or none do, preserving data consistency across the system.

* afterQuery
* beforeCreate
* afterCreate
* beforeUpdate
* afterUpdate
* beforeDelete
* afterDelete
* afterError
* catchException
* operation

## Plugins

For those advanced features, it's highly recommended to build plugin to support, for now, 2 core plugins are in building.

[Version Control Plugin]() is made for version control, once you import it, your content modification will be automatically tracked.

[Content Review Plugin]() is made for building a review / approve workflow for you, once you import this plugin, all of the cms content modification needs the review / approve, which could help you improve the content safty.
* install
  ```
  npm install @nest-mongo-cms/plugins
  ```
* import 
  ```
  import { VersionControl, ContentReview } from '@nest-mongo-cms/plugins';
  ```
* activate
  ```
    CMSModule.register({
      path: '/cms',
      schemas: {
        books: {
          plugins: [
            VersionControl({ max: 50, collection: '__book_versions' }),
            ContentReview({ collection: '__books_review' }),
          ]
        }
      }
    }
  
  ```
## Support

[Mail to me](mailto:felismargarita@hotmail.com)


## License

MIT
