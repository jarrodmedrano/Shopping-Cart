const Cart = (props) => {
  const { Card, Accordion, Button } = ReactBootstrap;
  let data = props.location.data ? props.location.data : products;
  console.log(`data:${JSON.stringify(data)}`);

  return <Accordion defaultActiveKey="0">{list}</Accordion>;
};

const useDataApi = (initialUrl, initialData) => {
  const { useState, useEffect, useReducer } = React;
  const [url, setUrl] = useState(initialUrl);

  console.log("initial url", initialUrl);
  console.log("initial data", initialData);

  const [state, dispatch] = useReducer(dataFetchReducer, {
    isLoading: false,
    isError: false,
    data: initialData,
  });
  console.log(`useDataApi called`);
  useEffect(() => {
    console.log("useEffect Called");
    let didCancel = false;
    const fetchData = async () => {
      dispatch({ type: "FETCH_INIT" });
      try {
        const result = await axios(url);
        console.log("FETCH FROM URl");
        if (!didCancel) {
          dispatch({ type: "FETCH_SUCCESS", payload: result.data });
        }
      } catch (error) {
        if (!didCancel) {
          dispatch({ type: "FETCH_FAILURE" });
        }
      }
    };
    fetchData();
    return () => {
      didCancel = true;
    };
  }, [url]);

  const removeProducts = (id) => {
    dispatch({ type: "REMOVE_ITEMS", payload: id });
  };

  return [state, setUrl, removeProducts];
};
const dataFetchReducer = (state, action) => {
  switch (action.type) {
    case "FETCH_INIT":
      return {
        ...state,
        isLoading: true,
        isError: false,
      };
    case "FETCH_SUCCESS":
      return {
        ...state,
        isLoading: false,
        isError: false,
        data: action.payload,
      };
    case "REMOVE_ITEMS":
      return {
        ...state,
        isLoading: false,
        isError: false,
        data: state.data.filter((item) => item !== action.payload),
      };
    case "FETCH_FAILURE":
      return {
        ...state,
        isLoading: false,
        isError: true,
      };
    default:
      throw new Error();
  }
};

const Products = (props) => {
  const prodUrl = "http://localhost:1337/api/products";
  const [items, setItems] = React.useState([]);
  const [cart, setCart] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const { Card, Accordion, Button, Container, Row, Col, Image, Input } =
    ReactBootstrap;
  //  Fetch Data
  const { Fragment, useState, useEffect, useReducer } = React;
  const [query, setQuery] = useState(prodUrl);
  const [{ data: apiData, isLoading, isError }, doFetch] = useDataApi(prodUrl, {
    data: [],
  });

  useEffect(() => {
    const { data: response } = apiData;
    if (response) {
      const mappedItems = response.map((item) => {
        return {
          ...item.id,
          ...item.attributes,
        };
      });
      setItems(mappedItems);
    } else {
      setItems([]);
    }
  }, [apiData]);

  const addToCart = React.useCallback(
    (e) => {
      let name = e.target.name;
      const itemStock = items.find((item) => item.name === name);
      console.log("itemstock", itemStock);
      if (itemStock.instock > 0) {
        let item = items.filter((item) => item.name == name);
        console.log(`add to Cart ${JSON.stringify(item)}`);
        setCart([...cart, ...item]);
        deleteStoreItem(name);
      }
    },
    [items]
  );

  const deleteStoreItem = React.useCallback(
    (name) => {
      const newItems = items.map((item, index) => {
        let newQty = item.instock;
        if (item.name === name && newQty > 0) {
          newQty--;
        }
        return {
          ...item,
          instock: newQty,
        };
      });

      setItems(newItems);
    },
    [items]
  );

  const deleteCartItem = (index) => {
    let newCart = cart.filter((item, i) => index != i);
    setCart(newCart);
  };

  const List = () => {
    return items.map((item, index) => {
      let n = index + 1049;
      let url = "https://picsum.photos/id/" + n + "/50/50";

      return (
        <li key={index}>
          <Image src={url} width={70} roundedCircle></Image>
          <Button variant="primary" size="large">
            {item.name}: ${item.cost} Qty: {item.instock}
          </Button>
          <input name={item.name} type="submit" onClick={addToCart}></input>
        </li>
      );
    });
  };

  const MemoList = React.memo(List);
  let cartList = cart.map((item, index) => {
    return (
      <Card key={index}>
        <Card.Header>
          <Accordion.Toggle as={Button} variant="link" eventKey={1 + index}>
            {item.name}
          </Accordion.Toggle>
        </Card.Header>
        <Accordion.Collapse eventKey={1 + index}>
          <Card.Body>
            <div className="row">
              <div className="col text-left">
                <label>
                  $ {item.cost} from {item.country}{" "}
                </label>
              </div>
              <div className="col text-right">
                <button
                  className="btn btn-danger"
                  onClick={() => deleteCartItem(index)}
                  type="button"
                >
                  Delete
                </button>
              </div>
            </div>
          </Card.Body>
        </Accordion.Collapse>
      </Card>
    );
  });

  let finalList = () => {
    let total = checkOut();
    let final = cart.map((item, index) => {
      return (
        <div key={index} index={index}>
          {item.name}
        </div>
      );
    });
    return { final, total };
  };

  const checkOut = () => {
    let costs = cart.map((item) => item.cost);
    const reducer = (accum, current) => accum + current;
    let newTotal = costs.reduce(reducer, 0);
    console.log(`total updated to ${newTotal}`);
    return newTotal;
  };

  const restockProducts = () => {
    console.log(`Restock called on ${query}`);
    doFetch(`${query}?id=${Math.random()}`, {});
  };

  return (
    <Container>
      {isLoading === true ? (
        <div>Loading....</div>
      ) : (
        <>
          <Row>
            <Col>
              <h1>Product List</h1>
              {isError === true ? (
                <p>Error loading products</p>
              ) : (
                <ul style={{ listStyleType: "none" }}>
                  <MemoList />
                </ul>
              )}
            </Col>
            <Col>
              <h1>Cart Contents</h1>
              <Accordion>{cartList}</Accordion>
            </Col>
            <Col>
              <h1>CheckOut </h1>
              <Button disabled={isLoading} onClick={checkOut}>
                CheckOut $ {finalList().total}
              </Button>
              <div> {finalList().total > 0 && finalList().final} </div>
            </Col>
          </Row>
          <Row>
            <form
              onSubmit={(event) => {
                restockProducts();
                event.preventDefault();
              }}
            >
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <button disabled={isLoading} type="submit">
                ReStock Products
              </button>
            </form>
          </Row>
        </>
      )}
    </Container>
  );
};
ReactDOM.render(<Products />, document.getElementById("root"));
