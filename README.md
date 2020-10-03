# mockserver

Reimplementation of [namshi's mockserver](https://github.com/namshi/mockserver) as it doesn't seem to be getting any support soon and there's lots of improvements that could be done.

I love the idea of mocking an API by dropping a bunch of files somewhere and letting
the directory structure decide which one of them we are going to serve on each case. However,
the lack of maintenance and the missing functionalities made me decide to make a revamp of
their mockserver.

The improvements coming with this revamp are:

- Multiple imports. Combine data from different files into one to easily recreate REST endpoints
while maintaining coherence in the data displayed. See REST [examples](./test/examples/rest)
for further information.

- Multiple evaluations inside body, header or status entries. See [example](./test/examples/GET--multiple eval.mock) for further information. The request and path to the file are
inside the scope of the evaluations to get all the information.

- Middlewares allowed. Now it's possible to add middlewares that will execute `before` or
`after` the handling of the request to add the same functionality to all the requests or to 
implement that complex behaviour that needs several functions. See 
[examples](./test/examples/middlewares) for further information.

- Improved permuations to find the files that better suits our requests. Now combinations of
headers & query parameters are allowed. If the body of the request is JSON, it gets serialised
as url parameters to make it easier to write the file name.

## Installation

You can install mockserver globally:

```bash
npm install -g @gguridi/mockserver
```

or

```bash
yarn global add @gguridi/mockserver
```

And you can install mockserver as part of your project:

```bash
npm install --save-dev @gguridi/mockserver
```

or

```bash
yarn add --dev @gguridi/mockserver
```

## Running

To run the server we must execute the binary indicating the folder where the mock files will
be (it can be relative to the `pwd`):

```bash
mockserver -m {mocks folder}
```

This will create an [express](https://github.com/expressjs/express) HTTP webserver, running
by default on port 8080.

To change the port the server starts running on we can do:

```bash
mockserver -m {mocks folder} -p 9000
```

For a detailed explanation of all the commands type:

```bash
mockserver --help
```

### Verbosity

By default the mockserver is running in `info` mode.

```bash
mockserver -m ./test/examples
Mockserver serving ./test/examples at http://:::8028
```

If we want to increase the verbosity of the mockserver we can decrease the log level
to report on:

```bash
mockserver -m ./test/examples -l debug
```

If we want to decrease the verbosity of the mockserver we can increase the log level
to report on:

```bash
mockserver -m ./test/examples -l error
```

The logging library used is [winston](https://github.com/winstonjs/winston) and we can
use any of the logging levels defined there.

### Header-based behaviour

By default we don't use header information to determine which mock file matches better the
request we are receiving. However, we can switch on this functionality by passing the list
of headers that we want to use as part of the filename selection process.

In this mockserver, the order the headers are received doesn't affect the file name matching.

To enable the header `Content-Type` and `Accept` we would do:

```bash
mockserver -m ./test/examples -h Content-Type,Accept
```

Additionally, we can also use the environment variable `MOCK_HEADERS` to achieve the same
result.

### Middlewares

It's possible to easily create middlewares that will be used for all the requests the 
mockserver receives. These middlewares are integrated with the express server.

To specify the middlewares folder we can do it as:

```bash
mockserver -m ./test/examples -w ./test/examples/middlewares
```

The middlewares must be added into two files `before.js` and `after.js` that indicates in which point of the request process they will be executed. 

If none of those files are present don't worry, they are not mandatory and even if the middlewares are not found the mockserver will ignore them and keep running.

The middlewares on each file will be executed in the order they are declared:

```javascript
const uppercase = (req, res, next) => {
    req.body = req.body.toUpperCase();
    next();
};

const uniqueId = (req, res, next) => {
    req.headers["X-Unique-ID"] = Math.floor(Math.random() * 999 + 1000);
    next();
};

module.exports = {
    uppercase,
    uniqueId,
};
```

In this case, the middleware to convert the request body in all uppercase will
be executed before the middleware that automatically adds a unique id into our request. When
evaluating code inside our `.mock` files, these headers will be available there.

For further information regarding middlewares check the 
[examples](./test/examples/middlewares).

### Request body parser

In order to support different types of API it's possible to specify the request body parser to use. At this point we use the [body-parser](https://github.com/expressjs/body-parser) library
that allows us different validations/parsing.

The default body parser is `json`, but we can enable any of the availables with:

```bash
mockserver -m ./test/examples -b (json|text|raw|urlencoded)
```

Depending which one of them we use the filename permutations we get to load files might change,
and the content of the `request.body` inside our code evaluations too.

- `json`: The request.body is passed as an object `request.body === {"id":"value"}`
- `text`: The request.body is passed as a string `request.body === This is the body`
- `raw` : The request.body is passed as a buffer.
- `urlencoded`: The request.body is passed as an object from a form encoded data.

### Response Delays

To keep the behaviour of the original [mockserver](https://github.com/namshi/mockserver)
the ability of delay the response has been implemented in the same way by adding
a `Response-Delay` header.

This header can be added in the mock file or in the `before` or `after` middlewares.

```bash
Response-Delay: 5000
```

The delay value is expected in milliseconds. If this header is not found there will be no delay.

## Mock files

The mock files naming conventions are based on the response that they are going to serve.
This mockserver follows the same approach as the original [mockserver](https://github.com/namshi/mockserver). Example of what can be done can be found [here](./test/examples).

```bash
$REQUEST-PATH/${HTTP-METHOD}--${BODY}--${QUERY PARAMS}_${HEADERS}.mock
```

To simplify the explanation, I will give a full example of the path/file seleccion process
that would happen when the `-h X-H1,X-H2` headers are activated and we receive the 
following request:

- A `POST`.
- With URL and parameters `/path/subpath/item?param1=value1` 
- A body in the request such as `{"key":"value"}`
- And the headers received would be `X-H1=h1` and `X-H2=h2`.

The mockserver would check the following files in order to determine which of them are
valid to serve that request. The filepaths are ordered from bigger to lower preference.
The `{mock-path}` passed to the mockserver in this example would be `./mock-folder`;

The wildcards `__` are also used in the permutations to find the correct file. Wildcards have
lower preference in the filepath match because they are more generic.

The complete list of permutations, in order, that the mockserver will check to find the most convenient response can be found [here](./test/examples/path-permutations.json).

### Query Parameters

This mockserver supports the query string parameters as part of the mocked files as the original [mockserver](https://github.com/namshi/mockserver) does. It replaces the occurrences of `?` with `--`, and then appends the entire string as part of the file name permutation.

```bash
GET /hello?a=b&c=d
hello/GET--a=b&c=d.mock
```

### POST body

This mockserver supports the POST body as part of the mocked files. The POST body
can be used altogether with query parameters and headers.

If the body is a JSON we automatically transform it into a query parameter string
to make the matching process easier. For more information regarding the permutations
that match files check the mock files [section](#Mock files).

```bash
POST /hello?a=b&c=d
{"id":"123"}

hello/POST--a=b&c=d--id=123.mock
```

If the POST body is a string, we don't change it:

```bash
POST /hello?a=b&c=d
This is the Body

hello/POST--a=b&c=d--this is the body.mock
```

### Wildcard slugs

If you want to match against a route with a wildcard because that chunk might be
dynamic, you can create a directory named `__` as a wildcard.

For example, let's say that you want mock the response of a GET request to `/users/:id`, you can create files named `users/1/GET.mock`, `users/2/GET.mock`, `users/3/GET.mock`, etc.

Or you can also create one file to accept all. A file `users/__/GET.mock`, with a wildcard, 
will match all the requests above stated.

### Imports

It's possible to import data or code from other files into the response we are seeking. To do 
that we can use the following syntax as the original [mockserver](https://github.com/namshi/mockserver) does (slightly different):

```bash
#import ./data.json;
```

Where the path is relative to the `.mock` file the mockserver is reading from. There's no limit
of how many imports you can use. And there's no limit of using it at the beginning of
the line. It can be used wherever you want.

In case of importing a `.js` file, the code is automatically evaluated and injected into
the response in the same place the `#import {file}.js` command was placed.

The following commands are completely valid:

```bash
{ "resources": #import ./resources-list.json; }
{ "resources": #import ./load-resources.js; }
```

The import statements can also be used to get status or header values:

```text
#import ./status.js;
X-Cache: #import ./cache.js;
```

### Evaluations

It's possible to insert code directly in the middle of our answers. The status, headers or
body can be obtained from executing code wrapped between `{{ }}` brackets. The code
can be multiline (except in status & headers, if you need complex code for that I suggest
to use the imports) and must output a string.

```text
{{ request.body === "valid" ? `HTTP/1.1 428 I'm a teapot` : `HTTP/1.1 400 Bad request` }}
X-Cache: {{ Math.floor(Math.random() * 999 + 1000) }}

{{
    const isValid = request.body === "valid";
    isValid ? `Yeah! It's valid.` : `Mmmmm... nope!`
}}
```

The imports are processed before the code evaluations, so it's possible to import text that
later on will evaluate it's code. You can use this feature to place common evaluations in
files and importing them from the responses that need it.

## Tests

Tests run on [jest](https://github.com/facebook/jest) and can be executed locally
by typing:

```bash
yarn test
```
