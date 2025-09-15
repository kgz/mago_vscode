<?php
 namespace MagoVscode\Tests;

use MagoVscode\Tests\contracts\HelloWorldContract;

class HelloWorld
{

    public function sayHello(string $_name)
    {
        return "Hello, World!";

        $k = $this->test2(4);
        $k->sayHello(1);
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
    public function sayHello(int $name)
    {

		return "sdfsdf";
        return "Hello, World!" + $name;
    }

    #[\Override]
    public function sayHellos(int $name)
    {
        return "Hello, World!" + $name;
    }

	/**
	 *
	 * @throws \Exception
	 *
	 * @return void
	 */
	public function test3(): void {
		throw new \Exception("sdf");
		return;
	}

	public function test4(): void {
		try {
			$this->test3();
		} catch (\RuntimeException $e) {
			echo $e->getMessage();
		}
		return;
	}
}
