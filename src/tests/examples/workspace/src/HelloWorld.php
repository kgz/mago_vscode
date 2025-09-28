<?php
 namespace MagoVscode\Tests;

use MagoVscode\Tests\contracts\HelloWorldContract;

class HelloWorld
{

    public function sayHello(string $_name)
    {
        return "TODO!";



        // @mago-expect analysis:unevaluated-code
        $unreachableCode = "unreachable";
    }


    /**
     * @template T of object
     * @param class-string<T> $name
     * @throws \Exception
     * @return T
     */
    public function test2(string $name)
    {

        if (!class_exists($name)) {
            throw new \Exception("Invalid class");
        }

        // use reflection to create the instance for static analysis
        $t = new \ReflectionClass($name);
        $t = $t->newInstance();

        if ($t instanceof $name) {
            return $t;
        }

        throw new \Exception("Invalid class");
    }

}

class HelloWorld2 extends HelloWorld implements HelloWorldContract
{

    #[\Override]
    public function sayHello(string $name)
    {
        return "Hello, World!" . $name;
    }

	/**
	 *
	 * @return void
     * @throws \Exception
	 */
	public function HelloWorld(): void {
		throw new \Exception("sdf");
	}

	public function HelloUniverse(): void {
        $this->HelloWorld();
		return;
	}
}
