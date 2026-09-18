import React from "react";

export default class ErrorBoundary extends React.Component {

  constructor(props) {

    super(props);

    this.state = {

      hasError: false,

      error: null

    };

  }

  static getDerivedStateFromError(error) {

    return {

      hasError: true,

      error

    };

  }

  componentDidCatch(error, info) {

    console.error("Application Error");

    console.error(error);

    console.error(info);

  }

  render() {

    if (this.state.hasError) {

      return (

        <div className="error-page">

          <h1>

            Something went wrong.

          </h1>

          <p>

            {this.state.error?.message}

          </p>

          <button

            onClick={() =>

              window.location.reload()

            }

          >

            Reload

          </button>

        </div>

      );

    }

    return this.props.children;

  }

}