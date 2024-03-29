pub use context::FromContext;
pub use dependencies::TypeDependencies;
use futures::Stream;
pub use handler::{Handler, HandlerType};
pub use router::Router;
pub use rpc_builder::RpcBuilder;
pub use rstrpc_macros::*;
use ts_rs::TS;

mod context;
mod dependencies;
mod handler;
mod router;
mod rpc_builder;

trait TsStream {
    type Item: TS;
}

impl<S, I> TsStream for S
where
    I: TS,
    S: Stream<Item = I>,
{
    type Item = I;
}
